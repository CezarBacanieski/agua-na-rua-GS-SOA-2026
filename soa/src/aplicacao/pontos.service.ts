import { CadastroPonto, PontoMonitorado } from '../dominio/ponto-monitorado';
import { GeradorId, NaoEncontrado, Paginacao, Relogio, RepositorioMonitoramento } from './contratos';

export class PontosService {
  constructor(private readonly repositorio: RepositorioMonitoramento, private readonly relogio: Relogio, private readonly novoId: GeradorId) {}

  async cadastrar(dados: CadastroPonto): Promise<PontoMonitorado> {
    const ponto = new PontoMonitorado(this.novoId(), dados, this.relogio.agora());
    await this.repositorio.inserirPonto(ponto);
    return ponto;
  }

  async buscar(id: string): Promise<PontoMonitorado> {
    const ponto = await this.repositorio.buscarPonto(id);
    if (!ponto) throw new NaoEncontrado('Ponto');
    return ponto;
  }

  listar(paginacao: Paginacao, bairro?: string) {
    return this.repositorio.listarPontos(paginacao, bairro?.trim());
  }

  async atualizar(id: string, dados: CadastroPonto): Promise<PontoMonitorado> {
    const ponto = (await this.buscar(id)).atualizar(dados);
    await this.repositorio.atualizarPonto(ponto);
    return ponto;
  }

  async excluir(id: string): Promise<void> {
    const ponto = await this.buscar(id);
    ponto.garantirExclusaoPermitida(await this.repositorio.contarObservacoes(id));
    await this.repositorio.excluirPonto(id);
  }
}
