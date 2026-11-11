import { config } from 'dotenv';
config({ quiet: true });

export interface Configuracao {
  banco: { host: string; port: number; database: string; username: string; password: string };
  porta: number;
  janelaRecenteMinutos: number;
  origensCors: string[];
}

function inteiro(valor: string | undefined, padrao: number, nome: string, maximo: number): number {
  const numero = valor === undefined ? padrao : Number(valor);
  if (!Number.isInteger(numero) || numero < 1 || numero > maximo) throw new Error(`${nome} deve ser um inteiro entre 1 e ${maximo}.`);
  return numero;
}

export function lerConfiguracao(env: NodeJS.ProcessEnv = process.env): Configuracao {
  if (!env.DB_PASSWORD || env.DB_PASSWORD === 'SUBSTITUA_POR_UMA_SENHA_LOCAL') {
    throw new Error('Configure DB_PASSWORD no ambiente. Para desenvolvimento, execute npm run setup.');
  }
  return {
    banco: {
      host: env.DB_HOST ?? '127.0.0.1',
      port: inteiro(env.DB_PORT, 55432, 'DB_PORT', 65535),
      database: env.DB_NAME ?? 'agua_na_rua',
      username: env.DB_USER ?? 'agua_app',
      password: env.DB_PASSWORD,
    },
    porta: inteiro(env.PORT, 3000, 'PORT', 65535),
    janelaRecenteMinutos: inteiro(env.JANELA_RECENTE_MINUTOS, 30, 'JANELA_RECENTE_MINUTOS', 1440),
    origensCors: (env.CORS_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean),
  };
}
