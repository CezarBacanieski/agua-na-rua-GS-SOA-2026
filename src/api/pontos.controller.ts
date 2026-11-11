import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiExtraModels, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PontosService } from '../aplicacao/pontos.service';
import { ObservacoesService } from '../aplicacao/observacoes.service';
import { CadastroPontoDto, ConsultaPontosDto, EXEMPLO_ID, PaginaPontosDto, paginarSaida, PontoSaidaDto, ResumoSaidaDto } from './dtos';
import { ApiErros, ProblemaDto } from './erros';

@ApiTags('Pontos monitorados')
@ApiExtraModels(ProblemaDto)
@ApiErros(500)
@Controller('pontos')
export class PontosController {
  constructor(private readonly pontos: PontosService, private readonly observacoes: ObservacoesService) {}

  @Post()
  @ApiOperation({ operationId: 'cadastrarPonto', summary: 'Cadastra um ponto acompanhado', description: 'Coordenadas e natureza simulada identificam o ponto e serão imutáveis. Não use dados pessoais.' })
  @ApiCreatedResponse({ type: PontoSaidaDto, headers: { Location: { description: 'URL do ponto criado', schema: { type: 'string' } } } })
  @ApiErros(400, 422)
  async cadastrar(@Body() dados: CadastroPontoDto, @Res({ passthrough: true }) resposta: Response) {
    const ponto = await this.pontos.cadastrar(dados);
    resposta.location(`/pontos/${ponto.id}`);
    return PontoSaidaDto.de(ponto);
  }

  @Get()
  @ApiOperation({ operationId: 'listarPontos', summary: 'Lista pontos com filtro por bairro e paginação' })
  @ApiOkResponse({ type: PaginaPontosDto }) @ApiErros(400)
  async listar(@Query() consulta: ConsultaPontosDto) {
    return paginarSaida(await this.pontos.listar(consulta, consulta.bairro), consulta, PontoSaidaDto.de);
  }

  @Get(':id')
  @ApiOperation({ operationId: 'consultarPonto', summary: 'Consulta um ponto pelo identificador' })
  @ApiParam({ name: 'id', format: 'uuid', example: EXEMPLO_ID })
  @ApiOkResponse({ type: PontoSaidaDto }) @ApiErros(400, 404)
  async buscar(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return PontoSaidaDto.de(await this.pontos.buscar(id)); }

  @Put(':id')
  @ApiOperation({ operationId: 'atualizarPonto', summary: 'Atualiza o cadastro de um ponto', description: 'Envie todos os campos. Coordenadas e dadosSimulados devem permanecer iguais ao cadastro original para preservar a identidade do local.' })
  @ApiParam({ name: 'id', format: 'uuid', example: EXEMPLO_ID })
  @ApiOkResponse({ type: PontoSaidaDto }) @ApiErros(400, 404, 422)
  async atualizar(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() dados: CadastroPontoDto) {
    return PontoSaidaDto.de(await this.pontos.atualizar(id, dados));
  }

  @Delete(':id') @HttpCode(204)
  @ApiOperation({ operationId: 'excluirPonto', summary: 'Exclui um ponto sem observações', description: 'Pontos com histórico são preservados e retornam 409.' })
  @ApiParam({ name: 'id', format: 'uuid', example: EXEMPLO_ID })
  @ApiNoContentResponse({ description: 'Ponto excluído; resposta sem corpo.' }) @ApiErros(400, 404, 409)
  async excluir(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> { await this.pontos.excluir(id); }

  @Get(':id/resumo')
  @ApiOperation({ operationId: 'consultarResumo', summary: 'Consulta a última observação e sua atualização', description: 'Distingue RECENTE, ANTIGA e SEM_INFORMACAO. Ausência de dados não indica rua livre. A janela configurável é uma hipótese do protótipo.' })
  @ApiParam({ name: 'id', format: 'uuid', example: EXEMPLO_ID })
  @ApiOkResponse({ type: ResumoSaidaDto }) @ApiErros(400, 404)
  async resumo(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) { return ResumoSaidaDto.de(id, await this.observacoes.resumo(id)); }
}
