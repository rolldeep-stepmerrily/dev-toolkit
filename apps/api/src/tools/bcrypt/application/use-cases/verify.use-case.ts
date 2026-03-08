import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ERRORS } from 'src/tools/bcrypt/bcrypt.error';
import { VerifyRequestDto, VerifyResponseDto } from 'src/tools/bcrypt/presenter/http/dto/verify.dto';

@Injectable()
export class VerifyUseCase {
  /**
   * bcrypt 해시 검증 실행
   *
   * @param {VerifyUseCaseProps} props 요청 데이터
   * @returns {Promise<VerifyResponseDto>} 검증 결과
   */
  async execute(props: VerifyUseCaseProps): Promise<VerifyResponseDto> {
    const { bodyDto } = props;

    this.validateHashFormat(bodyDto.hash);

    const isMatch = await this.compareHash(bodyDto.plainText, bodyDto.hash);

    return this.buildResponseDto(isMatch);
  }

  /**
   * bcrypt 해시 형식 유효성 검사
   *
   * @param {string} hash 검증할 해시 문자열
   * @throws {AppException} 유효하지 않은 해시 형식인 경우
   */
  private validateHashFormat(hash: string): void {
    const isValidHash = hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');

    if (!isValidHash) {
      throw new AppException(BCRYPT_ERRORS.INVALID_HASH);
    }
  }

  /**
   * 평문과 해시를 비교
   *
   * @param {string} plainText 평문
   * @param {string} hash 비교할 해시
   * @returns {Promise<boolean>} 일치 여부
   * @throws {AppException} 해시 비교 중 오류 발생 시
   */
  private async compareHash(plainText: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainText, hash);
    } catch {
      throw new AppException(BCRYPT_ERRORS.INVALID_HASH);
    }
  }

  /**
   * 응답 DTO 생성
   *
   * @param {boolean} isMatch 일치 여부
   * @returns {VerifyResponseDto} 응답 데이터
   */
  private buildResponseDto(isMatch: boolean): VerifyResponseDto {
    return VerifyResponseDto.from(isMatch);
  }
}

interface VerifyUseCaseProps {
  bodyDto: VerifyRequestDto;
}
