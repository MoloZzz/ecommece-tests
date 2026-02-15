import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,

  entities: [__dirname + '/../**/*.entity.{ts,js}'],

  migrations: [__dirname + '/migrations/*.{ts,js}'],
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: process.env.DATABASE_LOGGING === 'true' ? true : false,
  namingStrategy: new SnakeNamingStrategy(),
};

export default new DataSource(dataSourceOptions);
