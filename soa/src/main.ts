import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { criarAplicacao } from './bootstrap';
import { lerConfiguracao } from './infraestrutura/configuracao';
import { opcoesBanco } from './infraestrutura/opcoes-banco';

async function iniciar(): Promise<void> {
  const config = lerConfiguracao();
  const banco = await new DataSource(opcoesBanco(config)).initialize();
  try {
    if (await banco.showMigrations()) throw new Error('Existem migrações pendentes. Execute npm run migration:run antes de iniciar a API.');
    const app = await criarAplicacao({ banco, janelaRecenteMinutos: config.janelaRecenteMinutos, origensCors: config.origensCors });
    // O pool pertence ao processo principal; testes controlam seu próprio pool.
    const servidor = await app.listen(config.porta, '0.0.0.0');
    servidor.on('close', () => { if (banco.isInitialized) void banco.destroy(); });
    console.log(`API: http://localhost:${config.porta}/pontos | Swagger: http://localhost:${config.porta}/docs`);
  } catch (erro) {
    if (banco.isInitialized) await banco.destroy();
    throw erro;
  }
}
iniciar().catch((erro: unknown) => {
  // Erros de conexão podem conter detalhes de credenciais; só instruções próprias são exibidas.
  console.error(erro instanceof Error && erro.message.startsWith('Existem migrações') ? erro.message :
    'Falha ao iniciar. Confira o .env, a disponibilidade do PostgreSQL e as migrações.');
  process.exitCode = 1;
});
