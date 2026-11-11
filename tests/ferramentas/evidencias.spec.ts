import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

describe('Evidências após uma execução interrompida antes do Jest', () => {
  it('invalida o resultado antigo e recusa capturas quando o novo comando falha', () => {
    const pasta = mkdtempSync(join(tmpdir(), 'agua-evidencia-reprovada-'));
    try {
      mkdirSync(join(pasta, 'evidencias'));
      writeFileSync(join(pasta, 'evidencias/testes.json'), JSON.stringify({ success: true, startTime: 0 }));
      symlinkSync(resolve('node_modules'), join(pasta, 'node_modules'), 'junction');
      // Arquivo inexistente faz o preflight falhar sem criar ou alterar nenhum serviço Docker.
      const env = { ...process.env, DB_PASSWORD: 'senha-ficticia-de-fixture', COMPOSE_FILE: join(pasta, 'compose-inexistente.yaml') };
      const execucao = spawnSync(process.execPath, [resolve('scripts/testar.mjs')], { cwd: pasta, env, encoding: 'utf8' });
      expect(execucao.status).not.toBe(0);
      const estado = JSON.parse(readFileSync(join(pasta, 'evidencias/ultima-execucao.json'), 'utf8'));
      expect(estado.status).toBe('FALHOU');
      expect(() => readFileSync(join(pasta, 'evidencias/testes.json'))).toThrow();
      expect(readFileSync(join(pasta, 'evidencias/testes.txt'), 'utf8')).toContain('Resultado: FALHA');
      const captura = spawnSync(process.execPath, [resolve('scripts/capturar-evidencias.mjs')], { cwd: pasta, env, encoding: 'utf8' });
      expect(captura.status).not.toBe(0);
      expect(captura.stderr).toContain('A última execução de testes não foi aprovada');
    } finally { rmSync(pasta, { recursive: true, force: true }); }
  });
});
