import { RegraViolada } from './erros';
import { Observacao } from './observacao';

export class Periodo {
  constructor(readonly de?: Date, readonly ate?: Date) {
    if ((de && !Number.isFinite(de.getTime())) || (ate && !Number.isFinite(ate.getTime())) || (de && ate && de > ate)) {
      throw new RegraViolada('PERIODO_INVALIDO', 'O início do período deve ser válido e menor ou igual ao fim.');
    }
  }
}

export type Atualizacao = 'RECENTE' | 'ANTIGA' | 'SEM_INFORMACAO';

export class ResumoInformacao {
  readonly atualizacao: Atualizacao;

  constructor(
    readonly ultimaObservacao: Observacao | null,
    readonly consultadoEm: Date,
    readonly janelaRecenteMinutos: number,
  ) {
    if (!Number.isInteger(janelaRecenteMinutos) || janelaRecenteMinutos < 1 || janelaRecenteMinutos > 1440) {
      throw new RegraViolada('JANELA_INVALIDA', 'A janela de atualização deve estar entre 1 e 1440 minutos.');
    }
    this.atualizacao = ultimaObservacao === null ? 'SEM_INFORMACAO' :
      consultadoEm.getTime() - ultimaObservacao.observadoEm.getTime() <= janelaRecenteMinutos * 60_000 ? 'RECENTE' : 'ANTIGA';
  }
}
