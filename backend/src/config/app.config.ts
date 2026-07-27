import { registerAs } from '@nestjs/config';

console.log(process.env.JWT_SECRET);
export default registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-too',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  storage: {
    // Disco local (radiografias, documentos do prontuário). Sem
    // dependência de serviço externo — arquivo salvo em STORAGE_LOCAL_PATH
    // e servido via endpoint autenticado do próprio NestJS.
    localPath: process.env.STORAGE_LOCAL_PATH ?? './uploads',
  },
}));
