import { Check, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { CondicaoRelatada } from '../dominio/observacao';

@Entity('ponto_monitorado')
@Check('ponto_monitorado_nome_check', 'length(trim(nome)) > 0')
@Check('ponto_monitorado_cidade_check', 'length(trim(cidade)) > 0')
@Check('ponto_monitorado_bairro_check', 'length(trim(bairro)) > 0')
@Check('ponto_monitorado_latitude_check', 'latitude BETWEEN -90 AND 90')
@Check('ponto_monitorado_longitude_check', 'longitude BETWEEN -180 AND 180')
@Check('ponto_monitorado_referencia_local_check', 'length(trim(referencia_local)) > 0')
// Índices com expressão/ordem específica são mantidos pelas migrações, não pelo gerador.
@Index('ix_ponto_bairro', { synchronize: false })
export class PontoORM {
  @PrimaryColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 100 }) nome!: string;
  @Column({ type: 'varchar', length: 80 }) cidade!: string;
  @Column({ type: 'varchar', length: 80 }) bairro!: string;
  @Column({ name: 'referencia_local', type: 'varchar', length: 160 }) referenciaLocal!: string;
  @Column({ type: 'double precision' }) latitude!: number;
  @Column({ type: 'double precision' }) longitude!: number;
  @Column({ name: 'dados_simulados', type: 'boolean' }) dadosSimulados!: boolean;
  @Column({ name: 'criado_em', type: 'timestamptz' }) criadoEm!: Date;
  @OneToMany(() => ObservacaoORM, o => o.ponto) observacoes!: ObservacaoORM[];
}

@Entity('observacao')
@Check('observacao_condicao_relatada_check', "condicao_relatada IN ('SEM_AGUA_APARENTE', 'AGUA_ACUMULADA', 'ALAGAMENTO_RELATADO')")
@Check('observacao_origem_check', "origem = 'RELATO_MANUAL'")
@Check('ck_horario_observacao', 'observado_em <= registrado_em')
@Index('ix_observacao_ponto_horario', { synchronize: false })
export class ObservacaoORM {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'ponto_id', type: 'uuid' }) pontoId!: string;
  @ManyToOne(() => PontoORM, p => p.observacoes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ponto_id', foreignKeyConstraintName: 'fk_observacao_ponto' }) ponto!: PontoORM;
  @Column({ name: 'condicao_relatada', type: 'varchar', length: 30 }) condicaoRelatada!: CondicaoRelatada;
  @Column({ name: 'observado_em', type: 'timestamptz' }) observadoEm!: Date;
  @Column({ name: 'registrado_em', type: 'timestamptz' }) registradoEm!: Date;
  @Column({ type: 'varchar', length: 20 }) origem!: 'RELATO_MANUAL';
  @Column({ name: 'dados_simulados', type: 'boolean' }) dadosSimulados!: boolean;
}
