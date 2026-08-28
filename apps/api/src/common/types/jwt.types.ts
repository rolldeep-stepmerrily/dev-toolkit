import type { JwtSignOptions } from '@nestjs/jwt';

/** @nestjs/jwt v11 expiresIn 필드 타입 (ms의 StringValue | number) */
export type JwtExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;
