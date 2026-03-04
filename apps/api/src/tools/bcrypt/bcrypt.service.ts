import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ERRORS } from './bcrypt.error';
import type { HashDto } from './dto/hash.dto';
import type { VerifyDto } from './dto/verify.dto';

@Injectable()
export class BcryptService {
  /**
   * 평문을 bcrypt로 해시
   *
   * @param dto 해시 요청 DTO
   * @returns 생성된 bcrypt 해시
   */
  async hash(dto: HashDto): Promise<{ hash: string }> {
    const hash = await bcrypt.hash(dto.plainText, dto.saltRounds);

    return { hash };
  }

  /**
   * 평문과 bcrypt 해시 일치 여부 확인
   *
   * @param dto 검증 요청 DTO
   * @returns 일치 여부
   */
  async verify(dto: VerifyDto): Promise<{ isMatch: boolean }> {
    const isValidHash = dto.hash.startsWith('$2a$') || dto.hash.startsWith('$2b$') || dto.hash.startsWith('$2y$');
    if (!isValidHash) {
      throw new AppException(BCRYPT_ERRORS.INVALID_HASH);
    }

    try {
      const isMatch = await bcrypt.compare(dto.plainText, dto.hash);

      return { isMatch };
    } catch {
      throw new AppException(BCRYPT_ERRORS.INVALID_HASH);
    }
  }
}
