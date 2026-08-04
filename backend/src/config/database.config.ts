import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Configuração central de acesso ao PostgreSQL (instância local).
 * Todo acesso a dados passa pelo NestJS — o front-end nunca fala
 * diretamente com o banco.
 */
export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '123',
    database: process.env.DB_DATABASE ?? 'dentalcare',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    autoLoadEntities: true,
    synchronize: false, // NUNCA true em produção — usar migrations
    logging: process.env.NODE_ENV === 'development',
    entities: ['dist/modules/**/entities/*.entity.js'],
    migrations: ['dist/database/migrations/*.js'],
  }),
);
