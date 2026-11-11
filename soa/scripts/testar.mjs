import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { config } from 'dotenv';
config({ quiet: true });

const inicio = new Date();
const registros = [`Execução real iniciada em ${inicio.toISOString()}\nComando: npm ${process.argv.includes('--coverage') ? 'run test:coverage' : 'test'}\n`];
mkdirSync('evidencias', { recursive: true });
const estado = { comando: process.argv.includes('--coverage') ? 'npm run test:coverage' : 'npm test',
  iniciadaEm: inicio.toISOString(), finalizadaEm: null, status: 'EM_EXECUCAO' };
writeFileSync('evidencias/ultima-execucao.json', JSON.stringify(estado, null, 2) + '\n');
// Uma falha anterior ao Jest não pode deixar o JSON aprovado da execução anterior como resultado atual.
rmSync('evidencias/testes.json', { force: true });
function executar(comando, args, env = process.env) {
  const resultado = spawnSync(comando, args, { env, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  const saida = `${resultado.stdout ?? ''}${resultado.stderr ?? ''}`;
  process.stdout.write(saida);
  registros.push(`\n$ ${comando} ${args.join(' ')}\n${saida}`);
  if (resultado.error || resultado.status !== 0) throw new Error(`Falha ao executar ${comando}. Verifique a saída acima.`);
}
try {
  if (!process.env.DB_PASSWORD) throw new Error('Execute npm run setup antes dos testes.');
  executar('docker', ['compose', '--profile', 'test', 'up', '-d', '--wait', 'db-test']);
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  executar(npm, ['run', 'build']);
  executar(npm, ['run', 'typecheck']);
  const env = {
    ...process.env, NODE_ENV: 'test', SOA_TEST_DATABASE: '1',
    DB_HOST: '127.0.0.1', DB_PORT: process.env.TEST_DB_PORT ?? '55433',
    DB_NAME: 'agua_na_rua_test', JANELA_RECENTE_MINUTOS: '30',
  };
  executar(process.execPath, ['node_modules/jest/bin/jest.js', '--runInBand', '--verbose', '--json', '--outputFile=evidencias/testes.json',
    ...(process.argv.includes('--coverage') ? ['--coverage'] : [])], env);
  registros.push('\nResultado: todos os comandos concluídos com sucesso.\n');
  estado.status = 'APROVADA';
} catch (erro) {
  console.error(erro.message);
  registros.push(`\nResultado: FALHA. ${erro.message}\n`);
  process.exitCode = 1;
  estado.status = 'FALHOU';
} finally {
  estado.finalizadaEm = new Date().toISOString();
  registros.push(`Finalizado em ${estado.finalizadaEm}\n`);
  writeFileSync('evidencias/testes.txt', registros.join('').replace(/\u001b\[[0-9;]*m/g, ''));
  writeFileSync('evidencias/ultima-execucao.json', JSON.stringify(estado, null, 2) + '\n');
}
