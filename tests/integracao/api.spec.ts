import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { criarAplicacao } from '../../src/bootstrap';
import { conectarBancoTeste } from './banco-teste';

const agora = new Date('2026-11-11T12:00:00Z');
const pontoBody = {
  nome: 'Ponto fictício de teste', cidade: 'São Paulo', bairro: 'Bairro de teste',
  referenciaLocal: 'Referência fictícia', latitude: -23.46, longitude: -46.66, dadosSimulados: true,
};
const obsBody = { condicaoRelatada: 'AGUA_ACUMULADA', observadoEm: '2026-11-11T11:50:00Z', dadosSimulados: true };

describe('Contrato HTTP e persistência real no PostgreSQL', () => {
  let banco: DataSource;
  let app: INestApplication;
  const http = () => request(app.getHttpServer());
  async function criarPonto(body = pontoBody) { return (await http().post('/pontos').send(body).expect(201)).body; }
  async function subirApi() {
    app = await criarAplicacao({ banco, relogio: { agora: () => agora }, silencioso: true });
    await app.init();
  }
  beforeAll(async () => {
    banco = await conectarBancoTeste();
    await banco.dropDatabase();
    await banco.runMigrations();
    await subirApi();
  });
  afterAll(async () => { if (app) await app.close(); if (banco?.isInitialized) await banco.destroy(); });

  it('expõe os três pontos simulados carregados por migração', async () => {
    const { body } = await http().get('/pontos').expect(200);
    expect(body.total).toBe(3);
    expect(body.itens.every((p: { dadosSimulados: boolean }) => p.dadosSimulados)).toBe(true);
  });
  it('executa cadastro, leitura, atualização e exclusão persistentes com Location', async () => {
    const criado = await http().post('/pontos').send(pontoBody).expect(201);
    expect(criado.headers.location).toBe(`/pontos/${criado.body.id}`);
    const url = `/pontos/${criado.body.id}`;
    await http().get(url).expect(200).expect(({ body }) => expect(body.nome).toBe(pontoBody.nome));
    const atualizado = await http().put(url).send({ ...pontoBody, nome: 'Nome atualizado', referenciaLocal: 'Nova referência fictícia' }).expect(200);
    expect(atualizado.body.criadoEm).toBe(criado.body.criadoEm);
    await http().get(url).expect(200).expect(({ body }) => expect(body.nome).toBe('Nome atualizado'));
    await http().delete(url).expect(204).expect(({ text }) => expect(text).toBe(''));
    await http().get(url).expect(404);
  });
  it('mantém o cadastro após fechar API e conexão e abrir novas instâncias', async () => {
    const ponto = await criarPonto();
    await app.close(); await banco.destroy();
    banco = await conectarBancoTeste(); await subirApi();
    const { body } = await http().get(`/pontos/${ponto.id}`).expect(200);
    expect(body).toEqual(ponto);
  });
  it('filtra bairro sem diferenciar maiúsculas, pagina e conta o total', async () => {
    const { body } = await http().get('/pontos').query({ bairro: 'jArDiM pErI', pagina: 2, tamanho: 1 }).expect(200);
    expect(body).toMatchObject({ total: 3, pagina: 2, tamanho: 1, totalPaginas: 3 });
    expect(body.itens).toHaveLength(1);
    expect(body.itens[0].id).toBe('22222222-2222-4222-8222-222222222222');
  });
  it('não interpreta filtro como SQL', async () => {
    const { body } = await http().get('/pontos').query({ bairro: "' OR 1=1 --" }).expect(200);
    expect(body.total).toBe(0);
  });
  it.each([{ nome: null }, { latitude: 'abc' }, { dadosSimulados: 'false' }, { telefone: 'fictício' }])('recusa payload malformado ou campo não previsto %j', alteracao =>
    http().post('/pontos').send({ ...pontoBody, ...alteracao }).expect(400));
  it('recusa campo obrigatório ausente', async () => { const { nome: _nome, ...resto } = pontoBody; await http().post('/pontos').send(resto).expect(400); });
  it.each(['nome', 'cidade', 'bairro', 'referenciaLocal'])('recusa caractere nulo em %s com 400, sem erro SQL', async campo => {
    const resposta = await http().post('/pontos').send({ ...pontoBody, [campo]: 'texto\u0000inválido' }).expect(400);
    expect(resposta.body.code).toBe('ENTRADA_INVALIDA');
  });
  it('recusa caractere nulo no filtro por bairro com 400', async () => {
    await http().get('/pontos').query({ bairro: '\u0000' }).expect(400);
  });
  it('aceita o limite Unicode documentado e rejeita o caractere excedente', async () => {
    const nome = '🌧'.repeat(100);
    const ponto = await criarPonto({ ...pontoBody, nome });
    await http().get(`/pontos/${ponto.id}`).expect(200).expect(({ body }) => expect(body.nome).toBe(nome));
    await http().post('/pontos').send({ ...pontoBody, nome: nome + 'x' }).expect(400);
  });
  it('recusa JSON malformado como erro de entrada, sem falha interna', async () => {
    await http().post('/pontos').set('Content-Type', 'application/json').send('{"nome":').expect(400);
  });
  it.each([{ nome: '  ' }, { latitude: 91 }, { longitude: -181 }])('retorna 422 para regra de cadastro %j', alteracao =>
    http().post('/pontos').send({ ...pontoBody, ...alteracao }).expect(422));
  it('preserva a identidade territorial na atualização', async () => {
    const ponto = await criarPonto();
    await http().put(`/pontos/${ponto.id}`).send({ ...pontoBody, latitude: -25 }).expect(422);
    await http().get(`/pontos/${ponto.id}`).expect(200).expect(({ body }) => expect(body.latitude).toBe(pontoBody.latitude));
  });
  it.each([{ pagina: 0 }, { pagina: 1.5 }, { tamanho: 101 }, { tamanho: 'abc' }, { surpresa: 'x' }])('recusa consulta inválida %j', consulta =>
    http().get('/pontos').query(consulta).expect(400));
  it('recusa UUID inválido com Problem Details e sem SQL', async () => {
    const resposta = await http().get('/pontos/invalido').expect(400);
    expect(resposta.headers['content-type']).toContain('application/problem+json');
    expect(resposta.body).toMatchObject({ type: 'about:blank', status: 400, code: 'ENTRADA_INVALIDA', instance: '/pontos/invalido' });
    expect(resposta.body).not.toHaveProperty('stack');
  });
  it('retorna 404 para ponto inexistente em consulta, atualização, exclusão, histórico e resumo', async () => {
    const id = randomUUID();
    await http().get(`/pontos/${id}`).expect(404);
    await http().put(`/pontos/${id}`).send(pontoBody).expect(404);
    await http().delete(`/pontos/${id}`).expect(404);
    await http().get(`/pontos/${id}/observacoes`).expect(404);
    await http().get(`/pontos/${id}/resumo`).expect(404);
    await http().post(`/pontos/${id}/observacoes`).send(obsBody).expect(404);
  });
  it('distingue ponto sem observações de ponto inexistente', async () => {
    const ponto = await criarPonto();
    const resumo = await http().get(`/pontos/${ponto.id}/resumo`).expect(200);
    expect(resumo.body).toMatchObject({ pontoId: ponto.id, atualizacao: 'SEM_INFORMACAO', ultimaObservacao: null, janelaRecenteMinutos: 30 });
    const historico = await http().get(`/pontos/${ponto.id}/observacoes`).expect(200);
    expect(historico.body).toMatchObject({ itens: [], total: 0, totalPaginas: 0 });
  });
  it('registra observação, normaliza fuso, atribui origem e permite consultar Location', async () => {
    const ponto = await criarPonto();
    const criado = await http().post(`/pontos/${ponto.id}/observacoes`).send({ ...obsBody, observadoEm: '2026-11-11T08:50:00-03:00' }).expect(201);
    expect(criado.body).toMatchObject({ pontoId: ponto.id, observadoEm: '2026-11-11T11:50:00.000Z', registradoEm: agora.toISOString(), origem: 'RELATO_MANUAL' });
    const location = criado.headers.location;
    if (!location) throw new Error('POST de observação deve devolver Location.');
    await http().get(location).expect(200).expect(({ body }) => expect(body).toEqual(criado.body));
    const resumo = await http().get(`/pontos/${ponto.id}/resumo`).expect(200);
    expect(resumo.body.atualizacao).toBe('RECENTE');
    expect(resumo.body.ultimaObservacao.id).toBe(criado.body.id);
  });
  it('consulta observação apenas dentro do ponto a que ela pertence', async () => {
    const ponto = await criarPonto(); const outro = await criarPonto();
    const { body } = await http().post(`/pontos/${ponto.id}/observacoes`).send(obsBody).expect(201);
    await http().get(`/pontos/${outro.id}/observacoes/${body.id}`).expect(404);
  });
  it.each([
    { observadoEm: '2026-11-11T11:50:00' }, { observadoEm: '2026-02-30T12:00:00Z' },
    { condicaoRelatada: 'RUA_SEGURA' }, { registradoEm: '2026-01-01T00:00:00Z' },
    { origem: 'SENSOR' }, { dadosSimulados: null },
  ])('recusa formato ou atribuição indevida de observação %j', async alteracao => {
    const ponto = await criarPonto();
    await http().post(`/pontos/${ponto.id}/observacoes`).send({ ...obsBody, ...alteracao }).expect(400);
  });
  it('recusa horário futuro com 422 sem persistir o relato', async () => {
    const ponto = await criarPonto();
    const resposta = await http().post(`/pontos/${ponto.id}/observacoes`).send({ ...obsBody, observadoEm: '2026-11-11T12:00:01Z' }).expect(422);
    expect(resposta.body.code).toBe('HORARIO_INVALIDO');
    await http().get(`/pontos/${ponto.id}/observacoes`).expect(200).expect(({ body }) => expect(body.total).toBe(0));
  });
  it('impede apresentar relato de ponto simulado como informação real', async () => {
    const ponto = await criarPonto();
    await http().post(`/pontos/${ponto.id}/observacoes`).send({ ...obsBody, dadosSimulados: false }).expect(422);
  });
  it('não permite que relato antigo recebido depois substitua a observação mais recente', async () => {
    const ponto = await criarPonto();
    const recente = await http().post(`/pontos/${ponto.id}/observacoes`).send(obsBody).expect(201);
    await http().post(`/pontos/${ponto.id}/observacoes`).send({ ...obsBody, observadoEm: '2026-11-11T10:00:00Z' }).expect(201);
    const { body } = await http().get(`/pontos/${ponto.id}/resumo`).expect(200);
    expect(body.ultimaObservacao.id).toBe(recente.body.id);
    expect(body.atualizacao).toBe('RECENTE');
  });
  it('marca relato antigo sem alterar sua condição', async () => {
    const ponto = await criarPonto();
    await http().post(`/pontos/${ponto.id}/observacoes`).send({ ...obsBody, observadoEm: '2026-11-11T10:00:00Z' }).expect(201);
    const { body } = await http().get(`/pontos/${ponto.id}/resumo`).expect(200);
    expect(body.atualizacao).toBe('ANTIGA');
    expect(body.ultimaObservacao.condicaoRelatada).toBe('AGUA_ACUMULADA');
  });
  it('filtra período inclusivo e mantém desempate estável na paginação', async () => {
    const ponto = await criarPonto(); const ids: string[] = [];
    for (let i = 0; i < 3; i++) ids.push((await http().post(`/pontos/${ponto.id}/observacoes`).send(obsBody).expect(201)).body.id);
    await http().post(`/pontos/${ponto.id}/observacoes`).send({ ...obsBody, observadoEm: '2026-11-11T10:00:00Z' }).expect(201);
    const { body } = await http().get(`/pontos/${ponto.id}/observacoes`).query({ de: obsBody.observadoEm, ate: obsBody.observadoEm, pagina: 2, tamanho: 1 }).expect(200);
    expect(body).toMatchObject({ total: 3, pagina: 2, totalPaginas: 3 });
    expect(body.itens[0].id).toBe(ids.sort().reverse()[1]);
  });
  it('recusa período invertido e datas sem fuso', async () => {
    const ponto = await criarPonto();
    await http().get(`/pontos/${ponto.id}/observacoes`).query({ de: '2026-11-12T00:00:00Z', ate: '2026-11-11T00:00:00Z' }).expect(422);
    await http().get(`/pontos/${ponto.id}/observacoes`).query({ de: '2026-11-11T00:00:00' }).expect(400);
  });
  it('impede excluir ponto com histórico e mantém seus dados', async () => {
    const ponto = await criarPonto();
    await http().post(`/pontos/${ponto.id}/observacoes`).send(obsBody).expect(201);
    const resposta = await http().delete(`/pontos/${ponto.id}`).expect(409);
    expect(resposta.body.code).toBe('PONTO_COM_HISTORICO');
    await http().get(`/pontos/${ponto.id}`).expect(200);
    await http().get(`/pontos/${ponto.id}/observacoes`).expect(200).expect(({ body }) => expect(body.total).toBe(1));
  });
  it('publica OpenAPI gerada com todos os endpoints, modelos, exemplos e erros', async () => {
    const { body } = await http().get('/openapi.json').expect(200);
    const operacoes = Object.values(body.paths as Record<string, Record<string, unknown>>).flatMap(path => Object.values(path)) as Array<{ summary: string; tags: string[]; responses: Record<string, unknown> }>;
    expect(operacoes).toHaveLength(10);
    for (const op of operacoes) { expect(op.summary).toBeTruthy(); expect(op.tags.length).toBeGreaterThan(0); }
    expect(body.paths['/pontos/{id}'].delete.responses).toHaveProperty('409');
    expect(body.paths['/pontos/{pontoId}/observacoes'].post.responses).toHaveProperty('422');
    expect(body.components.schemas.CadastroPontoDto.properties.latitude.example).toBe(-23.463);
    for (const caminho of ['/pontos', '/pontos/{pontoId}/observacoes']) {
      const parametros = body.paths[caminho].get.parameters;
      expect(parametros.find((p: { name: string }) => p.name === 'pagina').schema.type).toBe('integer');
      expect(parametros.find((p: { name: string }) => p.name === 'tamanho').schema.type).toBe('integer');
    }
    expect(body.components.schemas).not.toHaveProperty('Object');
    expect(body.components.schemas.ProblemaDto.properties.status).toBeDefined();
    await http().get('/docs/').expect(200).expect('Content-Type', /html/);
  });
  it('verifica conexão no endpoint de saúde', async () => { await http().get('/health').expect(200).expect({ status: 'ok', banco: 'PostgreSQL' }); });
});
