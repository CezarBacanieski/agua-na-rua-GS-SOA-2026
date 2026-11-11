import { MigrationInterface, QueryRunner } from 'typeorm';

export class CriaPontosEObservacoes1794394800000 implements MigrationInterface {
  name = 'CriaPontosEObservacoes1794394800000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE ponto_monitorado (
      id UUID PRIMARY KEY,
      nome VARCHAR(100) NOT NULL CHECK (length(trim(nome)) > 0),
      cidade VARCHAR(80) NOT NULL CHECK (length(trim(cidade)) > 0),
      bairro VARCHAR(80) NOT NULL CHECK (length(trim(bairro)) > 0),
      latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
      longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
      dados_simulados BOOLEAN NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL
    )`);
    await q.query(`CREATE TABLE observacao (
      id UUID PRIMARY KEY,
      ponto_id UUID NOT NULL,
      condicao_relatada VARCHAR(30) NOT NULL CHECK (condicao_relatada IN ('SEM_AGUA_APARENTE', 'AGUA_ACUMULADA', 'ALAGAMENTO_RELATADO')),
      observado_em TIMESTAMPTZ NOT NULL,
      registrado_em TIMESTAMPTZ NOT NULL,
      origem VARCHAR(20) NOT NULL CHECK (origem = 'RELATO_MANUAL'),
      dados_simulados BOOLEAN NOT NULL,
      CONSTRAINT fk_observacao_ponto FOREIGN KEY (ponto_id) REFERENCES ponto_monitorado(id) ON DELETE RESTRICT,
      CONSTRAINT ck_horario_observacao CHECK (observado_em <= registrado_em)
    )`);
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE observacao');
    await q.query('DROP TABLE ponto_monitorado');
  }
}
