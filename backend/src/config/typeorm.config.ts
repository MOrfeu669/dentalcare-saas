import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Config separada da `database.config.ts` (que é consumida pelo
 * NestJS via ConfigService em runtime). O TypeORM CLI não entende o
 * formato `registerAs`/DI do Nest, por isso precisa de um DataSource
 * "puro" apontando para as mesmas entidades.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '123',
  database: process.env.DB_DATABASE ?? 'dentalcare',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: ['src/modules/**/entities/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
