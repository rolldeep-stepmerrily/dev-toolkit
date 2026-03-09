import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GetAvatarPresignedUrlDto {
  @ApiProperty({ description: '업로드할 파일명 (확장자 포함)', example: 'avatar.jpg' })
  @IsString()
  filename!: string;

  @ApiProperty({ description: 'MIME 타입', example: 'image/jpeg' })
  @IsString()
  @Matches(/^image\//)
  contentType!: string;
}

export class GetAvatarPresignedUrlResponseDto {
  @ApiProperty({ description: '파일 업로드용 presigned PUT URL (5분간 유효)' })
  presignedUrl!: string;

  @ApiProperty({ description: '업로드 후 파일의 최종 공개 URL' })
  objectUrl!: string;

  static from(data: GetAvatarPresignedUrlResponseDto): GetAvatarPresignedUrlResponseDto {
    return { presignedUrl: data.presignedUrl, objectUrl: data.objectUrl };
  }
}
