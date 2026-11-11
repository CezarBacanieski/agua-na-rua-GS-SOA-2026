import { NovaObservacao, Observacao } from '../dominio/observacao';
import { Periodo, ResumoInformacao } from '../dominio/consulta';
import { GeradorId, NaoEncontrado, Paginacao, Relogio, RepositorioMonitoramento } from './contratos';
import { PontosService } from './pontos.service';

export class ObservacoesService {
  constructor(
    private readonly repositorio: RepositorioMonitoramento,
    private readonly pontos: PontosService,
    private readonly relogio: Relogio,
    private readonly novoId: GeradorId,
    private readonly janelaRecenteMinutos: number,
  ) {}

  async registrar(pontoId: string, dados: NovaObservacao): Promise<Observacao> {
    const ponto = await this.pontos.buscar(pontoId);
    const observacao = Observacao.registrar(this.novoId(), ponto, dados, this.relogio.agora());
    await this.repositorio.inserirObservacao(observacao);
    return observacao;
  }

  async buscar(pontoId: string, id: string): Promise<Observacao> {
    await this.pontos.buscar(pontoId);
    const observacao = await this.repositorio.buscarObservacao(pontoId, id);
    if (!observacao) throw new NaoEncontrado('Observação');
    return observacao;
  }

  async listar(pontoId: string, periodo: Periodo, paginacao: Paginacao) {
    await this.pontos.buscar(pontoId);
    return this.repositorio.listarObservacoes(pontoId, periodo, paginacao);
  }

  async resumo(pontoId: string): Promise<ResumoInformacao> {
    await this.pontos.buscar(pontoId);
    return new ResumoInformacao(await this.repositorio.ultimaObservacao(pontoId), this.relogio.agora(), this.janelaRecenteMinutos);
  }
}
