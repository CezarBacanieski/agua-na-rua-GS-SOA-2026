import { applyDecorators, ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { RegraViolada } from '../dominio/erros';
import { NaoEncontrado } from '../aplicacao/contratos';

const titulos: Record<number, string> = {
  400: 'Entrada inválida', 404: 'Recurso não encontrado', 409: 'Conflito com o histórico',
  422: 'Regra de negócio violada', 500: 'Erro interno', 503: 'Serviço indisponível',
};
export class ProblemaDto {
  @ApiProperty({ example: 'about:blank' }) type!: string;
  @ApiProperty({ example: 'Entrada inválida' }) title!: string;
  @ApiProperty({ example: 400 }) status!: number;
  @ApiProperty({ example: 'Verifique os campos informados.' }) detail!: string;
  @ApiProperty({ example: '/pontos' }) instance!: string;
  @ApiProperty({ example: 'ENTRADA_INVALIDA', description: 'Código estável da falha; respostas 422 usam o código da regra violada.' }) code!: string;
  @ApiPropertyOptional({ type: [String], example: ['nome must be a string'] }) errors?: string[];
}
export function ApiErros(...status: number[]) {
  return applyDecorators(...status.map(code => ApiResponse({
    status: code, description: titulos[code],
    content: { 'application/problem+json': { schema: { $ref: '#/components/schemas/ProblemaDto' }, example: {
      type: 'about:blank', title: titulos[code], status: code,
      detail: code === 409 ? 'O ponto possui observações e seu histórico deve ser preservado.' :
        code === 500 ? 'Não foi possível concluir a solicitação.' : titulos[code],
      instance: '/pontos', code: ({ 400: 'ENTRADA_INVALIDA', 404: 'NAO_ENCONTRADO', 409: 'PONTO_COM_HISTORICO', 422: 'CADASTRO_INVALIDO', 500: 'ERRO_INTERNO' } as Record<number, string>)[code] ?? `HTTP_${code}`,
    } } },
  })));
}

@Catch()
export class FiltroErros implements ExceptionFilter {
  private readonly logger = new Logger(FiltroErros.name);
  catch(erro: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const resposta = http.getResponse<Response>();
    const requisicao = http.getRequest<Request>();
    let status = 500;
    let detail = 'Não foi possível concluir a solicitação.';
    let code = 'ERRO_INTERNO';
    let errors: string[] | undefined;
    if (erro instanceof RegraViolada) {
      status = erro.codigo === 'PONTO_COM_HISTORICO' ? 409 : 422;
      detail = erro.message;
      code = erro.codigo;
    } else if (erro instanceof NaoEncontrado) {
      status = 404; detail = erro.message; code = 'NAO_ENCONTRADO';
    } else if (erro instanceof HttpException) {
      status = erro.getStatus();
      code = status === 400 ? 'ENTRADA_INVALIDA' : `HTTP_${status}`;
      const corpo = erro.getResponse();
      const mensagem = typeof corpo === 'object' && corpo !== null && 'message' in corpo ? corpo.message : erro.message;
      if (Array.isArray(mensagem)) { errors = mensagem.map(String); detail = 'Verifique os campos informados.'; }
      else detail = String(mensagem);
    } else {
      // Não expor SQL, payloads ou credenciais na resposta ou no log de erro.
      this.logger.error(`Falha inesperada: ${erro instanceof Error ? erro.name : 'erro desconhecido'}`);
    }
    resposta.status(status).type('application/problem+json').json({
      type: 'about:blank', title: titulos[status] ?? 'Falha na solicitação', status, detail,
      instance: requisicao.path, code, ...(errors ? { errors } : {}),
    });
  }
}
