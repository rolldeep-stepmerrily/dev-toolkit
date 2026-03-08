import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashRequestDto, HashResponseDto } from 'src/tools/bcrypt/presenter/http/dto/hash.dto';

@Injectable()
export class HashUseCase {
  /**
   * bcrypt 해시 생성 실행
   *
   * @param {HashUseCaseProps} props 요청 데이터
   * @returns {Promise<HashResponseDto>} 생성된 해시
   */
  async execute(props: HashUseCaseProps): Promise<HashResponseDto> {
    const { bodyDto } = props;
    const hash = await this.hashPlainText(bodyDto.plainText, bodyDto.saltRounds);

    return this.buildResponseDto(hash);
  }

  /**
   * 평문을 bcrypt로 해시
   *
   * @param {string} plainText 평문
   * @param {number} saltRounds salt rounds
   * @returns {Promise<string>} 해시 문자열
   */
  private async hashPlainText(plainText: string, saltRounds: number): Promise<string> {
    return await bcrypt.hash(plainText, saltRounds);
  }

  /**
   * 응답 DTO 생성
   *
   * @param {string} hash 해시 문자열
   * @returns {HashResponseDto} 응답 데이터
   */
  private buildResponseDto(hash: string): HashResponseDto {
    return HashResponseDto.from(hash);
  }
}

interface HashUseCaseProps {
  bodyDto: HashRequestDto;
}
