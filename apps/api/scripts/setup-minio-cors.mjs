/** biome-ignore-all lint/suspicious/noConsole: script console 허용 */
import * as Minio from 'minio';

const { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_NAME } = process.env;

if (!(MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY && MINIO_BUCKET_NAME)) {
  console.error('Required env vars: MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_NAME');
  process.exit(1);
}

const url = new URL(MINIO_ENDPOINT);

const minioClient = new Minio.Client({
  endPoint: url.hostname,
  port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
  useSSL: url.protocol === 'https:',
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

// 버킷 존재 확인 및 생성
const exists = await minioClient.bucketExists(MINIO_BUCKET_NAME);
if (exists) {
  console.log(`✓ Bucket "${MINIO_BUCKET_NAME}" already exists`);
} else {
  await minioClient.makeBucket(MINIO_BUCKET_NAME);
  console.log(`✓ Bucket "${MINIO_BUCKET_NAME}" created`);
}

// Note: MinIO 2024+ configures CORS at the server level via `cors_allow_origin` in API config.
// Use: mc admin config set <alias> api cors_allow_origin=*
// The bucket-level PutBucketCors S3 API is not supported in recent MinIO versions.
console.log('\nDone!');
