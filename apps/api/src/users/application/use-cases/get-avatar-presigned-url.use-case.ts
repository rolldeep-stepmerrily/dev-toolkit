import { extname } from 'node:path';
import { Injectable } from '@nestjs/common';
import { S3Service } from 'src/common/s3';
import { GetAvatarPresignedUrlResponseDto } from 'src/users/presenter/http/dto/get-avatar-presigned-url.dto';

@Injectable()
export class GetAvatarPresignedUrlUseCase {
  constructor(private readonly s3Service: S3Service) {}

  /**
   * 아바타 이미지 업로드용 presigned URL 생성
   *
   * @param {GetAvatarPresignedUrlProps} props 사용자 ID, 파일명, MIME 타입
   * @returns {Promise<GetAvatarPresignedUrlResponseDto>} presigned PUT URL과 최종 object URL
   */
  async execute(props: GetAvatarPresignedUrlProps): Promise<GetAvatarPresignedUrlResponseDto> {
    const ext = extname(props.filename).toLowerCase();
    const key = `avatars/${props.userId}/${Date.now()}${ext}`;

    const result = await this.s3Service.generatePresignedPutUrl(key, props.contentType);

    return this.buildResponseDto(result);
  }

  /**
   * 응답 DTO 생성
   *
   * @param {{ presignedUrl: string; objectUrl: string }} result S3 presigned URL 결과
   * @returns {GetAvatarPresignedUrlResponseDto} 응답 데이터
   */
  private buildResponseDto(result: { presignedUrl: string; objectUrl: string }): GetAvatarPresignedUrlResponseDto {
    return GetAvatarPresignedUrlResponseDto.from(result);
  }
}

interface GetAvatarPresignedUrlProps {
  userId: number;
  filename: string;
  contentType: string;
}
