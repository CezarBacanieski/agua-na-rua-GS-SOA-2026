import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsNumber, IsString, Matches, Max, MaxLength, Min, NotContains, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CondicaoRelatada, Observacao } from '../dominio/observacao';
import { PontoMonitorado } from '../dominio/ponto-monitorado';
import { Paginacao, Pagina } from '../aplicacao/contratos';
import { ResumoInformacao } from '../dominio/consulta';

export const EXEMPLO_ID = '11111111-1111-4111-8111-111111111111';

export class CadastroPontoDto {
  @ApiProperty({ example: 'Ponto de demonstração D', maxLength: 100 })
  @IsString() @MaxLength(100) @NotContains('\u0000') nome!: string;
  @ApiProperty({ example: 'São Paulo', maxLength: 80 })
  @IsString() @MaxLength(80) @NotContains('\u0000') cidade!: string;
  @ApiProperty({ example: 'Jardim Peri', maxLength: 80 })
  @IsString() @MaxLength(80) @NotContains('\u0000') bairro!: string;
  @ApiProperty({ example: 'Referência fictícia para demonstração', maxLength: 160 })
  @IsString() @MaxLength(160) @NotContains('\u0000') referenciaLocal!: string;
  @ApiProperty({ example: -23.463, minimum: -90, maximum: 90 })
  @IsNumber({ allowNaN: false, allowInfinity: false }) latitude!: number;
  @ApiProperty({ example: -46.663, minimum: -180, maximum: 180 })
  @IsNumber({ allowNaN: false, allowInfinity: false }) longitude!: number;
  @ApiProperty({ example: true, description: 'Obrigatório identificar dados de demonstração.' })
  @IsBoolean() dadosSimulados!: boolean;
}

export class NovaObservacaoDto {
  @ApiProperty({ enum: CondicaoRelatada, example: CondicaoRelatada.AguaAcumulada })
  @IsEnum(CondicaoRelatada) condicaoRelatada!: CondicaoRelatada;
  @ApiProperty({ format: 'date-time', example: '2026-11-11T09:00:00-03:00', description: 'Instante observado com Z ou deslocamento explícito. Não pode estar no futuro.' })
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/, { message: 'observadoEm deve incluir fuso horário (Z ou ±HH:MM).' }) observadoEm!: string;
  @ApiProperty({ example: true })
  @IsBoolean() dadosSimulados!: boolean;
}

export class PaginacaoDto implements Paginacao {
  @ApiPropertyOptional({ type: 'integer', example: 1, default: 1, minimum: 1, maximum: 1000000 })
  @Type(() => Number) @IsInt() @Min(1) @Max(1000000) pagina: number = 1;
  @ApiPropertyOptional({ type: 'integer', example: 20, default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number) @IsInt() @Min(1) @Max(100) tamanho: number = 20;
}
export class ConsultaPontosDto extends PaginacaoDto {
  @ApiPropertyOptional({ example: 'Jardim Peri', description: 'Igualdade sem diferenciar maiúsculas e minúsculas.' })
  @ValidateIf((_o, v) => v !== undefined) @IsString() @MaxLength(80) @NotContains('\u0000') bairro?: string;
}
export class ConsultaObservacoesDto extends PaginacaoDto {
  @ApiPropertyOptional({ format: 'date-time', example: '2026-11-01T00:00:00Z', description: 'Início inclusivo; exige fuso horário.' })
  @ValidateIf((_o, v) => v !== undefined) @IsISO8601({ strict: true, strictSeparator: true }) @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/) de?: string;
  @ApiPropertyOptional({ format: 'date-time', example: '2026-11-11T23:59:59Z', description: 'Fim inclusivo; exige fuso horário.' })
  @ValidateIf((_o, v) => v !== undefined) @IsISO8601({ strict: true, strictSeparator: true }) @Matches(/T.*(?:Z|[+-]\d{2}:\d{2})$/) ate?: string;
}

export class PontoSaidaDto extends CadastroPontoDto {
  @ApiProperty({ format: 'uuid', example: EXEMPLO_ID }) id!: string;
  @ApiProperty({ format: 'date-time', example: '2026-11-01T12:00:00.000Z' }) criadoEm!: string;
  static de(p: PontoMonitorado): PontoSaidaDto {
    return Object.assign(new PontoSaidaDto(), { id: p.id, ...p.cadastro, criadoEm: p.criadoEm.toISOString() });
  }
}
export class ObservacaoSaidaDto {
  @ApiProperty({ format: 'uuid', example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' }) id!: string;
  @ApiProperty({ format: 'uuid', example: EXEMPLO_ID }) pontoId!: string;
  @ApiProperty({ enum: CondicaoRelatada, example: CondicaoRelatada.AguaAcumulada }) condicaoRelatada!: CondicaoRelatada;
  @ApiProperty({ format: 'date-time', example: '2026-11-01T12:00:00.000Z' }) observadoEm!: string;
  @ApiProperty({ format: 'date-time', example: '2026-11-01T12:01:00.000Z' }) registradoEm!: string;
  @ApiProperty({ enum: ['RELATO_MANUAL'], example: 'RELATO_MANUAL', description: 'Atribuída pelo servidor; não comprova verificação do relato.' }) origem!: string;
  @ApiProperty({ example: true }) dadosSimulados!: boolean;
  static de(o: Observacao): ObservacaoSaidaDto {
    return Object.assign(new ObservacaoSaidaDto(), {
      id: o.id, pontoId: o.pontoId, condicaoRelatada: o.condicaoRelatada,
      observadoEm: o.observadoEm.toISOString(), registradoEm: o.registradoEm.toISOString(), origem: o.origem, dadosSimulados: o.dadosSimulados,
    });
  }
}
export class MetadadosPaginaDto {
  @ApiProperty({ example: 3 }) total!: number;
  @ApiProperty({ example: 1 }) pagina!: number;
  @ApiProperty({ example: 20 }) tamanho!: number;
  @ApiProperty({ example: 1 }) totalPaginas!: number;
}
export class PaginaPontosDto extends MetadadosPaginaDto {
  @ApiProperty({ type: [PontoSaidaDto] }) itens!: PontoSaidaDto[];
}
export class PaginaObservacoesDto extends MetadadosPaginaDto {
  @ApiProperty({ type: [ObservacaoSaidaDto] }) itens!: ObservacaoSaidaDto[];
}
export function paginarSaida<T, R>(resultado: Pagina<T>, pg: Paginacao, mapear: (item: T) => R) {
  return { itens: resultado.itens.map(mapear), total: resultado.total, pagina: pg.pagina, tamanho: pg.tamanho, totalPaginas: Math.ceil(resultado.total / pg.tamanho) };
}
export class ResumoSaidaDto {
  @ApiProperty({ format: 'uuid', example: EXEMPLO_ID }) pontoId!: string;
  @ApiProperty({ enum: ['RECENTE', 'ANTIGA', 'SEM_INFORMACAO'], example: 'SEM_INFORMACAO' }) atualizacao!: string;
  @ApiProperty({ type: ObservacaoSaidaDto, nullable: true, description: 'null quando o ponto não tem observações.' }) ultimaObservacao!: ObservacaoSaidaDto | null;
  @ApiProperty({ format: 'date-time', example: '2026-11-11T12:00:00.000Z' }) consultadoEm!: string;
  @ApiProperty({ example: 30, description: 'Parâmetro de demonstração configurável; sem validação operacional.' }) janelaRecenteMinutos!: number;
  @ApiProperty({ example: 'Relatos não comprovam segurança para passagem. Ausência de informação não indica rua livre.' }) aviso!: string;
  static de(pontoId: string, r: ResumoInformacao): ResumoSaidaDto {
    return Object.assign(new ResumoSaidaDto(), {
      pontoId, atualizacao: r.atualizacao, ultimaObservacao: r.ultimaObservacao ? ObservacaoSaidaDto.de(r.ultimaObservacao) : null,
      consultadoEm: r.consultadoEm.toISOString(), janelaRecenteMinutos: r.janelaRecenteMinutos,
      aviso: 'Relatos não comprovam segurança para passagem. Ausência de informação não indica rua livre.',
    });
  }
}
