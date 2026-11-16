import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  apiPublicUrl: process.env.API_PUBLIC_URL || 'http://localhost:4000/api/v1',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  sessionSecret: process.env.SESSION_SECRET || 'viberhub-session-secret-min-32-chars-long!',
  csrfSecret: process.env.CSRF_SECRET || 'viberhub-csrf-secret-min-32-chars-long!',
  passwordResetSecret: process.env.PASSWORD_RESET_SECRET || 'viberhub-pwd-secret-min-32-chars-long!',
  maxUploadBytes: parseInt(process.env.MAX_UPLOAD_BYTES || '20971520', 10), // 20 MB default
  localStoragePath: process.env.LOCAL_STORAGE_PATH || path.resolve(process.cwd(), 'uploads'),
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'viber-hub-private',
    accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
    useSSL: process.env.S3_USE_SSL === 'true'
  }
};
