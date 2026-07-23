import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Uso: @Public() em endpoints como /auth/login que não exigem token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
