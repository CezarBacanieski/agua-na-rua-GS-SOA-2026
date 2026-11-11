import { DataSourceOptions } from 'typeorm';
import { Configuracao } from './configuracao';
import { ObservacaoORM, PontoORM } from './entidades';
import { CriaPontosEObservacoes1794394800000 } from '../migrations/1794394800000-CriaPontosEObservacoes';
import { AdicionaReferenciaEIndices1794394801000 } from '../migrations/1794394801000-AdicionaReferenciaEIndices';
import { CarregaDemonstracao1794394802000 } from '../migrations/1794394802000-CarregaDemonstracao';

export function opcoesBanco(config: Configuracao): DataSourceOptions {
  return {
    type: 'postgres',
    ...config.banco,
    entities: [PontoORM, ObservacaoORM],
    migrations: [CriaPontosEObservacoes1794394800000, AdicionaReferenciaEIndices1794394801000, CarregaDemonstracao1794394802000],
    migrationsTableName: 'historico_migracoes',
    synchronize: false,
    migrationsRun: false,
    logging: false,
    extra: { max: 10, connectionTimeoutMillis: 5000 },
  };
}
