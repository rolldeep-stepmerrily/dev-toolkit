import { HttpStatus } from '@nestjs/common';

export const BCRYPT_ERRORS = {
  INVALID_HASH: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 'BCRYPT_INVALID_HASH',
    message: '유효하지 않은 bcrypt 해시입니다.',
  },
  INVALID_SALT_ROUNDS: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 'BCRYPT_INVALID_SALT_ROUNDS',
    message: 'Salt rounds는 1 ~ 14 사이여야 합니다.',
  },
};
