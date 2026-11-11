import { MigrationInterface, QueryRunner } from 'typeorm';

// Evolução: ajudar o cidadão a reconhecer o local e acelerar as consultas do app.
export class AdicionaReferenciaEIndices1794394801000 implements MigrationInterface {
  name = 'AdicionaReferenciaEIndices1794394801000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE ponto_monitorado ADD COLUMN referencia_local VARCHAR(160) NOT NULL DEFAULT 'Referência não informada na versão inicial' CHECK (length(trim(referencia_local)) > 0)`);
    await q.query('ALTER TABLE ponto_monitorado ALTER COLUMN referencia_local DROP DEFAULT');
    await q.query('CREATE INDEX ix_ponto_bairro ON ponto_monitorado (lower(bairro))');
    await q.query('CREATE INDEX ix_observacao_ponto_horario ON observacao (ponto_id, observado_em DESC, registrado_em DESC, id DESC)');
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP INDEX ix_observacao_ponto_horario');
    await q.query('DROP INDEX ix_ponto_bairro');
    await q.query('ALTER TABLE ponto_monitorado DROP COLUMN referencia_local');
  }
}
