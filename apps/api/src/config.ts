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
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'r2storage',
    r2: {
      endpoint: process.env.R2_ENDPOINT || 'https://panel.mvcdn.cc/s3',
      adminEndpoint: process.env.R2_ADMIN_ENDPOINT || 'https://panel.mvcdn.cc/api/admin',
      bucket: process.env.R2_BUCKET || 'viberhub',
      accessKeyId: process.env.R2_ACCESS_KEY_ID || 'r2_f8ebdadacbe468df3403bc4a',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '18d35935c59172763d955fc37b12fe3cd15af768b02f04f3',
      adminSecret: process.env.R2_ADMIN_SECRET || '3062763f681b116f7d20da1f47ce84e9aae649d66aef3515d9d58cc37766a875',
      publicCdnBase: process.env.R2_PUBLIC_CDN_BASE || 'https://cdn.mvcdn.cc'
    }
  }
};
