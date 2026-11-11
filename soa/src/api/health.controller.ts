import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { ApiErros, ProblemaDto } from './erros';

class SaudeDto {
  @ApiProperty({ example: 'ok' }) status!: string;
  @ApiProperty({ example: 'PostgreSQL' }) banco!: string;
}
@ApiTags('Operação') @ApiExtraModels(ProblemaDto) @Controller('health')
export class HealthController {
  constructor(private readonly banco: DataSource) {}
  @Get() @ApiOperation({ operationId: 'consultarSaude', summary: 'Verifica disponibilidade da API e do banco' })
  @ApiOkResponse({ type: SaudeDto }) @ApiErros(503)
  async verificar(): Promise<SaudeDto> {
    try { await this.banco.query('SELECT 1'); return { status: 'ok', banco: 'PostgreSQL' }; }
    catch { throw new ServiceUnavailableException('Banco de dados indisponível.'); }
  }
}
