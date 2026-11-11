import { PontoMonitorado, CadastroPonto } from '../../src/dominio/ponto-monitorado';
import { CondicaoRelatada, Observacao } from '../../src/dominio/observacao';
import { Periodo, ResumoInformacao } from '../../src/dominio/consulta';
import { RegraViolada } from '../../src/dominio/erros';

const agora = new Date('2026-11-11T12:00:00Z');
const cadastro: CadastroPonto = {
  nome: ' Ponto fictício ', cidade: 'São Paulo', bairro: 'Jardim Peri', referenciaLocal: 'Referência fictícia',
  latitude: -23.46, longitude: -46.66, dadosSimulados: true,
};
const ponto = () => new PontoMonitorado('ponto-teste', cadastro, agora);
function observacao(minutos: number) {
  return Observacao.registrar('obs-teste', ponto(), {
    condicaoRelatada: CondicaoRelatada.AguaAcumulada,
    observadoEm: new Date(agora.getTime() - minutos * 60_000), dadosSimulados: true,
  }, agora);
}

describe('PontoMonitorado - cadastro e preservação do histórico', () => {
  it('normaliza espaços sem alterar o cadastro de entrada', () => {
    expect(ponto().cadastro.nome).toBe('Ponto fictício');
    expect(cadastro.nome).toBe(' Ponto fictício ');
  });
  it.each(['nome', 'cidade', 'bairro', 'referenciaLocal'] as const)('recusa %s vazio no domínio', campo => {
    expect(() => new PontoMonitorado('x', { ...cadastro, [campo]: '  ' }, agora)).toThrow(RegraViolada);
  });
  it.each(['nome', 'cidade', 'bairro', 'referenciaLocal'] as const)('recusa caractere nulo em %s antes de chegar ao banco', campo => {
    expect(() => new PontoMonitorado('x', { ...cadastro, [campo]: 'texto\u0000inválido' }, agora)).toThrow(RegraViolada);
  });
  it('conta caracteres Unicode de acordo com o limite do contrato e do PostgreSQL', () => {
    const nome = '🌧'.repeat(100);
    expect(new PontoMonitorado('x', { ...cadastro, nome }, agora).cadastro.nome).toBe(nome);
    expect(() => new PontoMonitorado('x', { ...cadastro, nome: nome + 'x' }, agora)).toThrow(RegraViolada);
  });
  it.each([[-90, -180], [90, 180]])('aceita coordenadas limítrofes %s, %s', (latitude, longitude) => {
    expect(new PontoMonitorado('x', { ...cadastro, latitude, longitude }, agora).cadastro.latitude).toBe(latitude);
  });
  it.each([[90.01, 0], [-90.01, 0], [0, 180.01], [0, -180.01], [NaN, 0], [0, Infinity]])('recusa coordenadas inválidas %s, %s', (latitude, longitude) => {
    expect(() => new PontoMonitorado('x', { ...cadastro, latitude, longitude }, agora)).toThrow(RegraViolada);
  });
  it('atualiza o cadastro preservando id e data de criação', () => {
    const atualizado = ponto().atualizar({ ...cadastro, nome: 'Novo nome' });
    expect(atualizado.id).toBe('ponto-teste');
    expect(atualizado.criadoEm).toEqual(agora);
    expect(atualizado.cadastro.nome).toBe('Novo nome');
  });
  it.each([{ latitude: -24 }, { longitude: -47 }, { dadosSimulados: false }])('recusa mudança da identidade territorial %j', alteracao => {
    expect(() => ponto().atualizar({ ...cadastro, ...alteracao })).toThrow(/identificam o ponto/);
  });
  it('permite excluir ponto sem observações', () => { expect(() => ponto().garantirExclusaoPermitida(0)).not.toThrow(); });
  it('recusa excluir ponto com histórico', () => { expect(() => ponto().garantirExclusaoPermitida(1)).toThrow(/histórico/); });
});

describe('Observacao - horário, origem e natureza dos dados', () => {
  it('atribui origem manual e horário de registro do relógio recebido', () => {
    expect(observacao(1)).toMatchObject({ origem: 'RELATO_MANUAL', registradoEm: agora, dadosSimulados: true });
  });
  it('aceita observação exatamente no instante do registro', () => { expect(observacao(0).observadoEm).toEqual(agora); });
  it('recusa horário futuro', () => { expect(() => observacao(-1 / 60_000)).toThrow(/horário/); });
  it('recusa data inválida mesmo sem HTTP', () => {
    expect(() => Observacao.registrar('x', ponto(), { condicaoRelatada: CondicaoRelatada.AguaAcumulada, observadoEm: new Date('inválido'), dadosSimulados: true }, agora)).toThrow(RegraViolada);
  });
  it('recusa condição desconhecida', () => {
    expect(() => new Observacao('x', 'p', 'LIVRE' as CondicaoRelatada, agora, agora, true)).toThrow(/Condição/);
  });
  it('não permite apresentar relato de ponto fictício como dado real', () => {
    expect(() => Observacao.registrar('x', ponto(), { condicaoRelatada: CondicaoRelatada.AguaAcumulada, observadoEm: agora, dadosSimulados: false }, agora)).toThrow(/simuladas/);
  });
});

describe('ResumoInformacao - idade não é condição de passagem', () => {
  it('retorna SEM_INFORMACAO e null quando não há observações', () => {
    expect(new ResumoInformacao(null, agora, 30)).toMatchObject({ atualizacao: 'SEM_INFORMACAO', ultimaObservacao: null });
  });
  it.each([[0, 'RECENTE'], [29, 'RECENTE'], [30, 'RECENTE'], [30 + 1 / 60_000, 'ANTIGA'], [60, 'ANTIGA']])('classifica idade %s como %s', (minutos, esperado) => {
    const resumo = new ResumoInformacao(observacao(Number(minutos)), agora, 30);
    expect(resumo.atualizacao).toBe(esperado);
    expect(resumo.ultimaObservacao?.condicaoRelatada).toBe('AGUA_ACUMULADA');
  });
  it('respeita janela diferente sem alterar o relato', () => { expect(new ResumoInformacao(observacao(10), agora, 5).atualizacao).toBe('ANTIGA'); });
  it.each([0, -1, 1441, 1.5])('recusa janela inválida %s', janela => { expect(() => new ResumoInformacao(null, agora, janela)).toThrow(RegraViolada); });
});

describe('Periodo', () => {
  it('aceita período aberto', () => { expect(() => new Periodo()).not.toThrow(); });
  it('aceita início igual ao fim', () => { expect(() => new Periodo(agora, agora)).not.toThrow(); });
  it('recusa intervalo invertido', () => { expect(() => new Periodo(agora, new Date(agora.getTime() - 1))).toThrow(/início/); });
  it('recusa data inválida', () => { expect(() => new Periodo(new Date('inválido'))).toThrow(RegraViolada); });
});
