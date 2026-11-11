import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ObservacoesService } from '../aplicacao/observacoes.service';
import { Periodo } from '../dominio/consulta';
import { ConsultaObservacoesDto, EXEMPLO_ID, NovaObservacaoDto, ObservacaoSaidaDto, PaginaObservacoesDto, paginarSaida } from './dtos';
import { ApiErros, ProblemaDto } from './erros';

@ApiTags('Observações')
@ApiExtraModels(ProblemaDto)
@ApiParam({ name: 'pontoId', format: 'uuid', example: EXEMPLO_ID })
@ApiErros(500)
@Controller('pontos/:pontoId/observacoes')
export class ObservacoesController {
  constructor(private readonly observacoes: ObservacoesService) {}

  @Post()
  @ApiOperation({ operationId: 'registrarObservacao', summary: 'Registra uma observação manual', description: 'O servidor atribui registradoEm e origem RELATO_MANUAL. Horários futuros são recusados. Relatos fictícios devem ter dadosSimulados=true.' })
  @ApiCreatedResponse({ type: ObservacaoSaidaDto, headers: { Location: { description: 'URL da observação criada', schema: { type: 'string' } } } })
  @ApiErros(400, 404, 422)
  async registrar(@Param('pontoId', new ParseUUIDPipe({ version: '4' })) pontoId: string, @Body() dados: NovaObservacaoDto, @Res({ passthrough: true }) resposta: Response) {
    const observacao = await this.observacoes.registrar(pontoId, { ...dados, observadoEm: new Date(dados.observadoEm) });
    resposta.location(`/pontos/${pontoId}/observacoes/${observacao.id}`);
    return ObservacaoSaidaDto.de(observacao);
  }

  @Get()
  @ApiOperation({ operationId: 'listarObservacoes', summary: 'Consulta histórico por período e paginação', description: 'Ordena por observadoEm, registradoEm e id em ordem decrescente. Os limites do período são inclusivos. Ponto existente sem relatos retorna lista vazia.' })
  @ApiOkResponse({ type: PaginaObservacoesDto }) @ApiErros(400, 404, 422)
  async listar(@Param('pontoId', new ParseUUIDPipe({ version: '4' })) pontoId: string, @Query() consulta: ConsultaObservacoesDto) {
    const periodo = new Periodo(consulta.de ? new Date(consulta.de) : undefined, consulta.ate ? new Date(consulta.ate) : undefined);
    return paginarSaida(await this.observacoes.listar(pontoId, periodo, consulta), consulta, ObservacaoSaidaDto.de);
  }

  @Get(':observacaoId')
  @ApiOperation({ operationId: 'consultarObservacao', summary: 'Consulta uma observação do ponto informado' })
  @ApiParam({ name: 'observacaoId', format: 'uuid', example: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' })
  @ApiOkResponse({ type: ObservacaoSaidaDto }) @ApiErros(400, 404)
  async buscar(@Param('pontoId', new ParseUUIDPipe({ version: '4' })) pontoId: string, @Param('observacaoId', new ParseUUIDPipe({ version: '4' })) observacaoId: string) {
    return ObservacaoSaidaDto.de(await this.observacoes.buscar(pontoId, observacaoId));
  }
}
