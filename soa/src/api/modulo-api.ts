import { DynamicModule, Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Relogio } from '../aplicacao/contratos';
import { PontosService } from '../aplicacao/pontos.service';
import { ObservacoesService } from '../aplicacao/observacoes.service';
import { RepositorioTypeOrm } from '../infraestrutura/repositorio-typeorm';
import { PontosController } from './pontos.controller';
import { ObservacoesController } from './observacoes.controller';
import { HealthController } from './health.controller';

@Module({})
export class ModuloApi {
  static registrar(banco: DataSource, relogio: Relogio, janelaRecenteMinutos: number): DynamicModule {
    const repositorio = new RepositorioTypeOrm(banco);
    const pontos = new PontosService(repositorio, relogio, randomUUID);
    const observacoes = new ObservacoesService(repositorio, pontos, relogio, randomUUID, janelaRecenteMinutos);
    return {
      module: ModuloApi,
      controllers: [PontosController, ObservacoesController, HealthController],
      providers: [
        { provide: DataSource, useValue: banco },
        { provide: PontosService, useValue: pontos },
        { provide: ObservacoesService, useValue: observacoes },
      ],
    };
  }
}
