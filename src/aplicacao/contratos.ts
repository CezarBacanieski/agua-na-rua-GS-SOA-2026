import { Observacao } from '../dominio/observacao';
import { Periodo } from '../dominio/consulta';
import { PontoMonitorado } from '../dominio/ponto-monitorado';

export interface Paginacao { pagina: number; tamanho: number }
export interface Pagina<T> { itens: T[]; total: number }
export interface RepositorioMonitoramento {
  buscarPonto(id: string): Promise<PontoMonitorado | null>;
  inserirPonto(ponto: PontoMonitorado): Promise<void>;
  atualizarPonto(ponto: PontoMonitorado): Promise<void>;
  listarPontos(paginacao: Paginacao, bairro?: string): Promise<Pagina<PontoMonitorado>>;
  contarObservacoes(pontoId: string): Promise<number>;
  excluirPonto(pontoId: string): Promise<void>;
  inserirObservacao(observacao: Observacao): Promise<void>;
  buscarObservacao(pontoId: string, id: string): Promise<Observacao | null>;
  listarObservacoes(pontoId: string, periodo: Periodo, paginacao: Paginacao): Promise<Pagina<Observacao>>;
  ultimaObservacao(pontoId: string): Promise<Observacao | null>;
}
export interface Relogio { agora(): Date }
export type GeradorId = () => string;

export class NaoEncontrado extends Error {
  constructor(recurso: string) {
    super(`${recurso} não encontrado.`);
    this.name = 'NaoEncontrado';
  }
}
