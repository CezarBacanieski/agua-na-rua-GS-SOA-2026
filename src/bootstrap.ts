import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { ModuloApi } from './api/modulo-api';
import { FiltroErros } from './api/erros';
import { Relogio } from './aplicacao/contratos';

export interface OpcoesAplicacao {
  banco: DataSource;
  janelaRecenteMinutos?: number;
  relogio?: Relogio;
  origensCors?: string[];
  silencioso?: boolean;
}

export async function criarAplicacao(opcoes: OpcoesAplicacao): Promise<INestApplication> {
  const modulo = ModuloApi.registrar(opcoes.banco, opcoes.relogio ?? { agora: () => new Date() }, opcoes.janelaRecenteMinutos ?? 30);
  const app = await NestFactory.create(modulo, { logger: opcoes.silencioso ? false : ['log', 'warn', 'error'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, forbidUnknownValues: true }));
  app.useGlobalFilters(new FiltroErros());
  app.enableCors({ origin: opcoes.origensCors?.length ? opcoes.origensCors : false });
  const definicao = new DocumentBuilder().setTitle('Água na Rua - API SOA')
    .setDescription('CitizenTech para consultar pontos acompanhados e registrar observações manuais. Dados de demonstração são identificados como simulados. Não fornece previsão de enchentes nem garantia de passagem segura.')
    .setVersion('1.0.0').build();
  const documento = SwaggerModule.createDocument(app, definicao);
  SwaggerModule.setup('docs', app, documento, { jsonDocumentUrl: '/openapi.json', swaggerOptions: { persistAuthorization: false, displayRequestDuration: true } });
  app.enableShutdownHooks();
  return app;
}
