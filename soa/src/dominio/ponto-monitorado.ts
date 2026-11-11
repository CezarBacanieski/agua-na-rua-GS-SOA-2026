import { RegraViolada } from './erros';

export interface CadastroPonto {
  nome: string;
  cidade: string;
  bairro: string;
  referenciaLocal: string;
  latitude: number;
  longitude: number;
  dadosSimulados: boolean;
}

export class PontoMonitorado {
  readonly cadastro: Readonly<CadastroPonto>;

  constructor(
    readonly id: string,
    cadastro: CadastroPonto,
    readonly criadoEm: Date,
  ) {
    const normalizado = { ...cadastro };
    const limites = { nome: 100, cidade: 80, bairro: 80, referenciaLocal: 160 } as const;
    for (const campo of Object.keys(limites) as (keyof typeof limites)[]) {
      const recebido = normalizado[campo];
      if (typeof recebido !== 'string' || recebido.includes('\u0000')) {
        throw new RegraViolada('CADASTRO_INVALIDO', `${campo} deve ser texto sem caracteres nulos.`);
      }
      const valor = recebido.trim();
      // PostgreSQL VARCHAR e maxLength do contrato contam caracteres Unicode, não unidades UTF-16.
      if (!valor || [...valor].length > limites[campo]) {
        throw new RegraViolada('CADASTRO_INVALIDO', `${campo} deve ter entre 1 e ${limites[campo]} caracteres.`);
      }
      normalizado[campo] = valor;
    }
    if (!Number.isFinite(cadastro.latitude) || cadastro.latitude < -90 || cadastro.latitude > 90 ||
        !Number.isFinite(cadastro.longitude) || cadastro.longitude < -180 || cadastro.longitude > 180) {
      throw new RegraViolada('COORDENADAS_INVALIDAS', 'Latitude deve estar entre -90 e 90 e longitude entre -180 e 180.');
    }
    if (typeof cadastro.dadosSimulados !== 'boolean') {
      throw new RegraViolada('NATUREZA_DOS_DADOS_INVALIDA', 'Informe se os dados são simulados.');
    }
    this.cadastro = Object.freeze(normalizado);
  }

  atualizar(cadastro: CadastroPonto): PontoMonitorado {
    // A localização identifica o trecho observado; não reatribuir seu histórico a outro lugar.
    if (cadastro.latitude !== this.cadastro.latitude || cadastro.longitude !== this.cadastro.longitude ||
        cadastro.dadosSimulados !== this.cadastro.dadosSimulados) {
      throw new RegraViolada('IDENTIDADE_DO_PONTO_IMUTAVEL', 'Coordenadas e natureza simulada identificam o ponto e não podem ser alteradas. Cadastre outro ponto.');
    }
    return new PontoMonitorado(this.id, cadastro, this.criadoEm);
  }

  garantirExclusaoPermitida(totalObservacoes: number): void {
    if (totalObservacoes > 0) {
      throw new RegraViolada('PONTO_COM_HISTORICO', 'O ponto possui observações e seu histórico deve ser preservado.');
    }
  }
}
