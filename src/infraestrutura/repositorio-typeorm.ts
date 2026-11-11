import { DataSource, QueryFailedError } from 'typeorm';
import { NaoEncontrado, Pagina, Paginacao, RepositorioMonitoramento } from '../aplicacao/contratos';
import { Periodo } from '../dominio/consulta';
import { RegraViolada } from '../dominio/erros';
import { Observacao } from '../dominio/observacao';
import { PontoMonitorado } from '../dominio/ponto-monitorado';
import { ObservacaoORM, PontoORM } from './entidades';

function pontoDominio(p: PontoORM): PontoMonitorado {
  return new PontoMonitorado(p.id, {
    nome: p.nome, cidade: p.cidade, bairro: p.bairro, referenciaLocal: p.referenciaLocal,
    latitude: p.latitude, longitude: p.longitude, dadosSimulados: p.dadosSimulados,
  }, p.criadoEm);
}
function observacaoDominio(o: ObservacaoORM): Observacao {
  return new Observacao(o.id, o.pontoId, o.condicaoRelatada, o.observadoEm, o.registradoEm, o.dadosSimulados);
}
function violouChaveEstrangeira(erro: unknown): boolean {
  return erro instanceof QueryFailedError && (erro.driverError as { code?: string }).code === '23503';
}

export class RepositorioTypeOrm implements RepositorioMonitoramento {
  constructor(private readonly banco: DataSource) {}

  async buscarPonto(id: string): Promise<PontoMonitorado | null> {
    const p = await this.banco.getRepository(PontoORM).findOneBy({ id });
    return p ? pontoDominio(p) : null;
  }
  async inserirPonto(p: PontoMonitorado): Promise<void> {
    await this.banco.getRepository(PontoORM).insert({ id: p.id, ...p.cadastro, criadoEm: p.criadoEm });
  }
  async atualizarPonto(p: PontoMonitorado): Promise<void> {
    const resultado = await this.banco.getRepository(PontoORM).update(p.id, { ...p.cadastro });
    if (!resultado.affected) throw new NaoEncontrado('Ponto');
  }
  async listarPontos(pg: Paginacao, bairro?: string): Promise<Pagina<PontoMonitorado>> {
    const query = this.banco.getRepository(PontoORM).createQueryBuilder('p');
    if (bairro) query.where('lower(p.bairro) = lower(:bairro)', { bairro });
    const [itens, total] = await query.orderBy('p.nome', 'ASC').addOrderBy('p.id', 'ASC')
      .skip((pg.pagina - 1) * pg.tamanho).take(pg.tamanho).getManyAndCount();
    return { itens: itens.map(pontoDominio), total };
  }
  contarObservacoes(pontoId: string): Promise<number> {
    return this.banco.getRepository(ObservacaoORM).countBy({ pontoId });
  }
  async excluirPonto(id: string): Promise<void> {
    try {
      const resultado = await this.banco.getRepository(PontoORM).delete(id);
      if (!resultado.affected) throw new NaoEncontrado('Ponto');
    } catch (erro) {
      // Protege também a corrida entre a contagem no caso de uso e um novo relato.
      if (violouChaveEstrangeira(erro)) throw new RegraViolada('PONTO_COM_HISTORICO', 'O ponto possui observações e seu histórico deve ser preservado.');
      throw erro;
    }
  }
  async inserirObservacao(o: Observacao): Promise<void> {
    try {
      await this.banco.getRepository(ObservacaoORM).insert({
        id: o.id, pontoId: o.pontoId, condicaoRelatada: o.condicaoRelatada,
        observadoEm: o.observadoEm, registradoEm: o.registradoEm, origem: o.origem, dadosSimulados: o.dadosSimulados,
      });
    } catch (erro) {
      if (violouChaveEstrangeira(erro)) throw new NaoEncontrado('Ponto');
      throw erro;
    }
  }
  async buscarObservacao(pontoId: string, id: string): Promise<Observacao | null> {
    const o = await this.banco.getRepository(ObservacaoORM).findOneBy({ id, pontoId });
    return o ? observacaoDominio(o) : null;
  }
  async listarObservacoes(pontoId: string, periodo: Periodo, pg: Paginacao): Promise<Pagina<Observacao>> {
    const query = this.banco.getRepository(ObservacaoORM).createQueryBuilder('o').where('o.pontoId = :pontoId', { pontoId });
    if (periodo.de) query.andWhere('o.observadoEm >= :de', { de: periodo.de });
    if (periodo.ate) query.andWhere('o.observadoEm <= :ate', { ate: periodo.ate });
    const [itens, total] = await query.orderBy('o.observadoEm', 'DESC').addOrderBy('o.registradoEm', 'DESC').addOrderBy('o.id', 'DESC')
      .skip((pg.pagina - 1) * pg.tamanho).take(pg.tamanho).getManyAndCount();
    return { itens: itens.map(observacaoDominio), total };
  }
  async ultimaObservacao(pontoId: string): Promise<Observacao | null> {
    const o = await this.banco.getRepository(ObservacaoORM).findOne({
      where: { pontoId }, order: { observadoEm: 'DESC', registradoEm: 'DESC', id: 'DESC' },
    });
    return o ? observacaoDominio(o) : null;
  }
}
