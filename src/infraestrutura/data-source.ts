import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { lerConfiguracao } from './configuracao';
import { opcoesBanco } from './opcoes-banco';

export default new DataSource(opcoesBanco(lerConfiguracao()));
