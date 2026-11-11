import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { config } from 'dotenv';
config({ quiet: true });
const require = createRequire(import.meta.url);
const { default: banco } = require('../dist/infraestrutura/data-source.js');
const base = `http://127.0.0.1:${process.env.PORT ?? 3000}`;
mkdirSync('evidencias', { recursive: true });
const esc = valor => String(valor).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
let browser;
try {
  const estado = JSON.parse(readFileSync('evidencias/ultima-execucao.json', 'utf8'));
  if (estado.status !== 'APROVADA') throw new Error('A última execução de testes não foi aprovada. Execute npm test antes de capturar evidências.');
  const testes = JSON.parse(readFileSync('evidencias/testes.json', 'utf8'));
  if (!testes.success || testes.startTime < Date.parse(estado.iniciadaEm)) throw new Error('Resultado de testes antigo ou reprovado. Execute npm test novamente.');
  const health = await fetch(`${base}/health`);
  if (!health.ok) throw new Error('Inicie a API com npm start antes de capturar evidências.');
  const log = readFileSync('evidencias/testes.txt', 'utf8');
  await banco.initialize();
  const migracoes = await banco.query('SELECT name FROM historico_migracoes ORDER BY id');
  writeFileSync('evidencias/migracoes.json', JSON.stringify(migracoes, null, 2) + '\n');
  const chamadas = [
    ['GET', '/pontos'],
    ['GET', '/pontos/11111111-1111-4111-8111-111111111111/resumo'],
    ['GET', '/pontos/22222222-2222-4222-8222-222222222222/resumo'],
    ['GET', '/pontos/invalido'],
    ['DELETE', '/pontos/22222222-2222-4222-8222-222222222222'],
    ['POST', '/pontos/22222222-2222-4222-8222-222222222222/observacoes', {
      condicaoRelatada: 'AGUA_ACUMULADA', observadoEm: '2099-01-01T00:00:00Z', dadosSimulados: true,
    }],
  ];
  const respostas = [];
  for (const [metodo, caminho, entrada] of chamadas) {
    const resposta = await fetch(`${base}${caminho}`, { method: metodo,
      ...(entrada ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(entrada) } : {}),
    });
    respostas.push({ metodo, caminho, entrada, status: resposta.status, corpo: await resposta.json() });
  }
  if (respostas.map(r => r.status).join(',') !== '200,200,200,400,409,422') throw new Error('As respostas reais divergiram dos status esperados.');
  writeFileSync('evidencias/api-respostas.json', JSON.stringify({ capturadoEm: new Date().toISOString(), respostas }, null, 2) + '\n');
  writeFileSync('evidencias/openapi.json', JSON.stringify(await (await fetch(`${base}/openapi.json`)).json(), null, 2) + '\n');
  const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await chromium.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/docs/`);
  await page.locator('.opblock').first().waitFor();
  await page.screenshot({ path: 'evidencias/swagger.png', fullPage: true });
  const bloco = page.locator('.opblock-get').filter({ has: page.locator('[data-path="/pontos"]') });
  await bloco.locator('.opblock-summary').click();
  await bloco.getByRole('button', { name: 'Try it out', exact: true }).click();
  const respostaUI = page.waitForResponse(r => new URL(r.url()).pathname === '/pontos' && r.request().method() === 'GET');
  await bloco.getByRole('button', { name: 'Execute', exact: true }).click();
  if ((await respostaUI).status() !== 200) throw new Error('A consulta pelo Swagger falhou.');
  await bloco.locator('.responses-inner .response-col_status').first().waitFor();
  await bloco.screenshot({ path: 'evidencias/swagger-execucao.png' });
  const suites = testes.testResults.map(t => `<tr><td>${esc(t.name.split(/[\\/]/).slice(-2).join('/'))}</td><td>${t.assertionResults.length}</td><td>${esc(t.status)}</td></tr>`).join('');
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Água na Rua - evidências reais</title>
  <style>body{font:18px/1.6 system-ui;background:#f2f6fa;color:#132a3d;margin:0;padding:48px}main{max-width:1180px;margin:auto}h1{font-size:36px;margin:0}h2{font-size:24px;margin-top:32px}.sub{color:#526978}.kpis{display:flex;gap:20px;margin:28px 0}.kpi{background:white;border:1px solid #c7d6e2;border-radius:10px;padding:20px;flex:1}.n{display:block;color:#07746c;font-size:42px;font-weight:700}table{width:100%;border-collapse:collapse;background:white}td,th{padding:12px 16px;text-align:left;border:1px solid #c7d6e2}pre{background:#152737;color:#d9efee;padding:24px;border-radius:10px;white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.5 ui-monospace,monospace}li{margin:6px 0}details{margin-top:20px}</style>
  <main><h1>Água na Rua · Verificação do backend</h1><p class="sub">Relatório gerado de execuções reais, não uma captura de terminal.<br>Captura: ${esc(new Date().toISOString())} · PostgreSQL 17 · Node ${esc(process.version)}</p>
  <div class="kpis"><div class="kpi"><span class="n">${testes.numPassedTests}</span>testes aprovados</div><div class="kpi"><span class="n">${testes.numFailedTests}</span>testes reprovados</div><div class="kpi"><span class="n">${migracoes.length}</span>migrações aplicadas</div></div>
  <h2>Suítes executadas</h2><table><tr><th>Arquivo</th><th>Testes</th><th>Resultado</th></tr>${suites}</table>
  <h2>Histórico lido do banco da aplicação</h2><ol>${migracoes.map(m => `<li>${esc(m.name)}</li>`).join('')}</ol>
  <h2>Respostas HTTP observadas</h2><table><tr><th>Requisição</th><th>Status</th></tr>${respostas.map(r => `<tr><td>${esc(r.metodo + ' ' + r.caminho)}</td><td>${r.status}</td></tr>`).join('')}</table>
  <details><summary>Saída integral dos comandos de teste</summary><pre>${esc(log)}</pre></details></main></html>`;
  writeFileSync('evidencias/relatorio.html', html);
  await page.goto(pathToFileURL(resolve('evidencias/relatorio.html')).href);
  await page.screenshot({ path: 'evidencias/verificacao.png', fullPage: true });
  await page.locator('details').evaluate(el => { el.open = true; });
  await page.locator('details').screenshot({ path: 'evidencias/testes-saida.png' });
  console.log('Evidências reais gravadas em evidencias/: Swagger, execução HTTP, relatório, contrato e respostas.');
} finally {
  if (browser) await browser.close();
  if (banco.isInitialized) await banco.destroy();
}
