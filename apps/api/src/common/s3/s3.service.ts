import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PresignedPutResult {
  presignedUrl: string;
  objectUrl: string;
}

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(configService: ConfigService) {
    this.client = new S3Client({
      endpoint: configService.getOrThrow<string>('MINIO_ENDPOINT'),
      region: 'us-east-1',
      credentials: {
        accessKeyId: configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
        secretAccessKey: configService.getOrThrow<string>('MINIO_SECRET_KEY'),
      },
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });

    this.bucket = configService.getOrThrow<string>('MINIO_BUCKET_NAME');
    this.publicUrl = configService.getOrThrow<string>('MINIO_PUBLIC_URL');
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.initBucket();

      this.logger.log(`S3 bucket "${this.bucket}" ready`);
    } catch (err) {
      this.logger.warn(`S3 bucket init failed: ${(err as Error).message}`);
    }
  }

  /**
   * Presigned PUT URL과 업로드 후 접근 가능한 최종 URL을 반환
   *
   * @param {string} key S3 오브젝트 키 (경로 포함 파일명)
   * @param {string} contentType 파일 MIME 타입
   * @returns {Promise<PresignedPutResult>} presigned URL과 object URL
   */
  async generatePresignedPutUrl(key: string, contentType: string): Promise<PresignedPutResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
    const objectUrl = `${this.publicUrl}/${this.bucket}/${key}`;

    return { presignedUrl, objectUrl };
  }

  private async initBucket(): Promise<void> {
    const bucketExists = await this.checkBucketExists();

    if (!bucketExists) {
      await this.createBucket();
    }

    await this.configureCors();
  }

  private async checkBucketExists(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));

      return true;
    } catch {
      return false;
    }
  }

  private async createBucket(): Promise<void> {
    await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));

    await this.client.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        }),
      }),
    );
  }

  private async configureCors(): Promise<void> {
    await this.client.send(
      new PutBucketCorsCommand({
        Bucket: this.bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: ['*'],
              AllowedMethods: ['PUT'],
              AllowedHeaders: ['*'],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      }),
    );
  }
}
