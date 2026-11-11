import { MigrationInterface, QueryRunner } from 'typeorm';

export class CarregaDemonstracao1794394802000 implements MigrationInterface {
  name = 'CarregaDemonstracao1794394802000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`INSERT INTO ponto_monitorado (id,nome,cidade,bairro,latitude,longitude,dados_simulados,criado_em,referencia_local) VALUES
      ('11111111-1111-4111-8111-111111111111','Demonstração A - sem observações','São Paulo','Jardim Peri',-23.46,-46.66,true,'2026-11-01T12:00:00Z','Ponto fictício A; não representa trecho validado'),
      ('22222222-2222-4222-8222-222222222222','Demonstração B - histórico antigo','São Paulo','Jardim Peri',-23.461,-46.661,true,'2026-11-01T12:00:00Z','Ponto fictício B; não representa trecho validado'),
      ('33333333-3333-4333-8333-333333333333','Demonstração C - relato simulado','São Paulo','Jardim Peri',-23.462,-46.662,true,'2026-11-01T12:00:00Z','Ponto fictício C; não representa trecho validado')`);
    await q.query(`INSERT INTO observacao (id,ponto_id,condicao_relatada,observado_em,registrado_em,origem,dados_simulados) VALUES
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','22222222-2222-4222-8222-222222222222','AGUA_ACUMULADA','2026-11-01T12:00:00Z','2026-11-01T12:01:00Z','RELATO_MANUAL',true),
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','22222222-2222-4222-8222-222222222222','SEM_AGUA_APARENTE','2026-11-01T13:00:00Z','2026-11-01T13:01:00Z','RELATO_MANUAL',true),
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','33333333-3333-4333-8333-333333333333','ALAGAMENTO_RELATADO','2026-11-01T12:00:00Z','2026-11-01T12:01:00Z','RELATO_MANUAL',true)`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM observacao WHERE id IN ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3')`);
    await q.query(`DELETE FROM ponto_monitorado WHERE id IN ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333')`);
  }
}
