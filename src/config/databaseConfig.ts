import { registerAs } from '@nestjs/config';

import { DataSource, DataSourceOptions } from 'typeorm';
import { loadAppEnv } from '../load-env';

loadAppEnv();
const prod = process.env.NODE_ENV === 'production';

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER_NAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  maxQueryExecutionTime: 1000,
  cache: false,
  logging: prod ? ['query', 'error', 'log'] : 'all',
  logger: 'advanced-console',
  entities: [__dirname + '/../**/entities/*.{ts,js}'],
  migrations: [__dirname + '/../**/migrations/**/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false, // never use TRUE in production!
  // debug: true,
  //acquireTimeout: 3000, // 3 seconds
};
export default registerAs('typeorm', () => dataSourceOptions);

export const connectionSource = new DataSource(
  dataSourceOptions as DataSourceOptions,
);
