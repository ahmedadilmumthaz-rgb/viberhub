import { config } from '../config.js';

export class R2StorageClient {
  private static get endpoint() {
    return config.storage.r2.endpoint;
  }
  private static get adminEndpoint() {
    return config.storage.r2.adminEndpoint;
  }
  private static get bucket() {
    return config.storage.r2.bucket;
  }
  private static get secretAccessKey() {
    return config.storage.r2.secretAccessKey;
  }
  private static get adminSecret() {
    return config.storage.r2.adminSecret;
  }

  /**
   * Upload an object directly to R2 Storage bucket on mvcdn.cc
   */
  static async uploadObject(key: string, buffer: Buffer, contentType: string): Promise<boolean> {
    try {
      const encodedPath = key.split('/').map(encodeURIComponent).join('/');
      const url = `${this.endpoint}/${this.bucket}/${encodedPath}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'x-api-key': this.secretAccessKey,
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString()
        },
        body: buffer
      });

      if (!res.ok) {
        console.warn(`R2 upload returned ${res.status}: ${res.statusText}`);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('R2 upload failed (falling back to local cache):', err);
      return false;
    }
  }

  /**
   * Generate an authenticated short-lived presigned download URL from mvcdn.cc
   */
  static async getPresignedDownloadUrl(key: string, expiresInSeconds: number = 3600): Promise<string | null> {
    try {
      const url = `${this.adminEndpoint}/buckets/${this.bucket}/presigned`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Admin-Secret': this.adminSecret,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key, expiresInSeconds })
      });

      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        return data.url || null;
      }
      return null;
    } catch (err) {
      console.warn('R2 presigned URL generation error:', err);
      return null;
    }
  }

  /**
   * Fetch object buffer directly from R2 Storage
   */
  static async getObjectBuffer(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    try {
      const encodedPath = key.split('/').map(encodeURIComponent).join('/');
      const url = `${this.endpoint}/${this.bucket}/${encodedPath}`;

      const res = await fetch(url, {
        headers: {
          'x-api-key': this.secretAccessKey
        }
      });

      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || 'application/octet-stream';
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType
      };
    } catch (err) {
      console.warn('R2 getObject error:', err);
      return null;
    }
  }

  /**
   * Delete object from R2 Storage on mvcdn.cc
   */
  static async deleteObject(key: string): Promise<boolean> {
    try {
      const encodedPath = key.split('/').map(encodeURIComponent).join('/');
      const url = `${this.endpoint}/${this.bucket}/${encodedPath}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'x-api-key': this.secretAccessKey
        }
      });
      return res.status === 204 || res.status === 200;
    } catch (err) {
      console.warn('R2 deleteObject error:', err);
      return false;
    }
  }
}
