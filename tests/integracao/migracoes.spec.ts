import { DataSource } from 'typeorm';
import { conectarBancoTeste } from './banco-teste';
import { CriaPontosEObservacoes1794394800000 } from '../../src/migrations/1794394800000-CriaPontosEObservacoes';
import { AdicionaReferenciaEIndices1794394801000 } from '../../src/migrations/1794394801000-AdicionaReferenciaEIndices';

describe('Migrações no PostgreSQL vazio e evolução com dados existentes', () => {
  let banco: DataSource;
  afterAll(async () => { if (banco?.isInitialized) await banco.destroy(); });

  it('cria, evolui, carrega seed, reaplica sem duplicar e permite rollback completo', async () => {
    banco = await conectarBancoTeste({ migrations: [CriaPontosEObservacoes1794394800000] });
    await banco.dropDatabase();
    expect((await banco.runMigrations()).map(m => m.name)).toEqual(['CriaPontosEObservacoes1794394800000']);
    await banco.query(`INSERT INTO ponto_monitorado (id,nome,cidade,bairro,latitude,longitude,dados_simulados,criado_em)
      VALUES ('44444444-4444-4444-8444-444444444444','Legado','São Paulo','Teste',0,0,true,'2026-01-01T00:00:00Z')`);
    await banco.destroy();

    banco = await conectarBancoTeste({ migrations: [CriaPontosEObservacoes1794394800000, AdicionaReferenciaEIndices1794394801000] });
    expect((await banco.runMigrations()).map(m => m.name)).toEqual(['AdicionaReferenciaEIndices1794394801000']);
    expect((await banco.query('SELECT referencia_local FROM ponto_monitorado'))[0].referencia_local).toBe('Referência não informada na versão inicial');
    await banco.destroy();

    banco = await conectarBancoTeste();
    expect((await banco.runMigrations()).map(m => m.name)).toEqual(['CarregaDemonstracao1794394802000']);
    expect((await banco.query('SELECT count(*)::int AS total FROM ponto_monitorado'))[0].total).toBe(4);
    expect((await banco.query('SELECT count(*)::int AS total FROM historico_migracoes'))[0].total).toBe(3);
    expect(await banco.runMigrations()).toHaveLength(0);
    await banco.undoLastMigration();
    expect((await banco.query('SELECT count(*)::int AS total FROM ponto_monitorado'))[0].total).toBe(1);
    await banco.undoLastMigration();
    expect((await banco.query("SELECT count(*)::int AS total FROM information_schema.columns WHERE table_name='ponto_monitorado' AND column_name='referencia_local'"))[0].total).toBe(0);
    await banco.undoLastMigration();
    expect((await banco.query("SELECT to_regclass('public.ponto_monitorado') AS tabela"))[0].tabela).toBeNull();
    expect(await banco.runMigrations()).toHaveLength(3);
  });

  it('mantém chave estrangeira RESTRICT como defesa contra exclusão concorrente', async () => {
    await expect(banco.query("DELETE FROM ponto_monitorado WHERE id='22222222-2222-4222-8222-222222222222'"))
      .rejects.toMatchObject({ driverError: { code: '23503' } });
    expect((await banco.query("SELECT count(*)::int AS total FROM ponto_monitorado WHERE id='22222222-2222-4222-8222-222222222222'"))[0].total).toBe(1);
  });
  it('mantém o mapeamento ORM compatível com o esquema sem propor exclusão de índices ou restrições', async () => {
    const diferencas = await banco.driver.createSchemaBuilder().log();
    expect(diferencas.upQueries.map(q => q.query)).toEqual([]);
  });
});
