import { RegraViolada } from './erros';
import { PontoMonitorado } from './ponto-monitorado';

export enum CondicaoRelatada {
  SemAguaAparente = 'SEM_AGUA_APARENTE',
  AguaAcumulada = 'AGUA_ACUMULADA',
  AlagamentoRelatado = 'ALAGAMENTO_RELATADO',
}

export interface NovaObservacao {
  condicaoRelatada: CondicaoRelatada;
  observadoEm: Date;
  dadosSimulados: boolean;
}

export class Observacao {
  readonly origem = 'RELATO_MANUAL' as const;

  constructor(
    readonly id: string,
    readonly pontoId: string,
    readonly condicaoRelatada: CondicaoRelatada,
    readonly observadoEm: Date,
    readonly registradoEm: Date,
    readonly dadosSimulados: boolean,
  ) {
    if (!Object.values(CondicaoRelatada).includes(condicaoRelatada)) {
      throw new RegraViolada('CONDICAO_INVALIDA', 'Condição relatada não reconhecida.');
    }
    if (!Number.isFinite(observadoEm.getTime()) || !Number.isFinite(registradoEm.getTime()) || observadoEm > registradoEm) {
      throw new RegraViolada('HORARIO_INVALIDO', 'A observação deve ter horário válido, igual ou anterior ao registro.');
    }
    if (typeof dadosSimulados !== 'boolean') {
      throw new RegraViolada('NATUREZA_DOS_DADOS_INVALIDA', 'Informe se a observação é simulada.');
    }
  }

  static registrar(id: string, ponto: PontoMonitorado, dados: NovaObservacao, agora: Date): Observacao {
    if (ponto.cadastro.dadosSimulados && !dados.dadosSimulados) {
      throw new RegraViolada('PONTO_SIMULADO', 'Observações de um ponto de demonstração também devem ser identificadas como simuladas.');
    }
    return new Observacao(id, ponto.id, dados.condicaoRelatada, dados.observadoEm, agora, dados.dadosSimulados);
  }
}
