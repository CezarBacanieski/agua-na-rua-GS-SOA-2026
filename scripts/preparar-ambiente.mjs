import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const destino = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(destino)) {
  console.log('.env já existe; configuração preservada.');
} else {
  const modelo = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  writeFileSync(destino, modelo.replace('SUBSTITUA_POR_UMA_SENHA_LOCAL', randomBytes(24).toString('hex')), { mode: 0o600, flag: 'wx' });
  console.log('.env criado com senha aleatória local. Credenciais não são exibidas.');
}
