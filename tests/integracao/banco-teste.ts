import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { lerConfiguracao } from '../../src/infraestrutura/configuracao';
import { opcoesBanco } from '../../src/infraestrutura/opcoes-banco';

export async function conectarBancoTeste(opcoes?: Partial<DataSourceOptions>): Promise<DataSource> {
  const config = lerConfiguracao();
  // Apenas o serviço descartável de testes criado pelo comando npm test.
  if (process.env.NODE_ENV !== 'test' || process.env.SOA_TEST_DATABASE !== '1' ||
      config.banco.database !== 'agua_na_rua_test' || config.banco.host !== '127.0.0.1' ||
      config.banco.port !== Number(process.env.TEST_DB_PORT ?? 55433)) {
    throw new Error('Banco de testes isolado não configurado. Use npm test.');
  }
  return new DataSource({ ...opcoesBanco(config), ...opcoes } as DataSourceOptions).initialize();
}
