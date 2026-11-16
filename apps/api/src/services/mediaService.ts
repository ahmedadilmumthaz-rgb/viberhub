import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { config } from '../config.js';
import { R2StorageClient } from '../storage/r2Client.js';

export const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

export class MediaService {
  static async uploadFile(
    workspaceId: string,
    uploaderId: string,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    }
  ) {
    // Validate size
    if (file.size > config.maxUploadBytes) {
      const err: any = new Error(
        `File exceeds maximum allowed size of ${config.maxUploadBytes / (1024 * 1024)}MB`
      );
      err.statusCode = 413;
      err.code = 'FILE_TOO_LARGE';
      throw err;
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      const err: any = new Error(`MIME type "${file.mimetype}" is not permitted`);
      err.statusCode = 400;
      err.code = 'UNSUPPORTED_MEDIA_TYPE';
      throw err;
    }

    // Check extension
    const ext = path.extname(file.originalname).toLowerCase();
    const disallowedExtensions = ['.exe', '.sh', '.bat', '.cmd', '.js', '.vbs', '.py', '.php'];
    if (disallowedExtensions.includes(ext)) {
      const err: any = new Error(`File extension "${ext}" is prohibited`);
      err.statusCode = 400;
      err.code = 'PROHIBITED_FILE_EXTENSION';
      throw err;
    }

    // Calculate checksum
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Storage key: private random key
    const fileId = uuidv4();
    const storageKey = `${workspaceId}/${fileId}-${hash.slice(0, 8)}${ext}`;

    // 1. Upload to R2 Storage hosted on mvcdn.cc
    const r2Uploaded = await R2StorageClient.uploadObject(storageKey, file.buffer, file.mimetype);

    // 2. Cache locally for immediate fast streaming
    try {
      const uploadsDir = path.resolve(config.localStoragePath, workspaceId);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.resolve(config.localStoragePath, storageKey);
      fs.writeFileSync(filePath, file.buffer);
    } catch (localErr) {
      // Non-fatal if R2 upload succeeded
      if (!r2Uploaded) {
        throw localErr;
      }
    }

    const now = new Date().toISOString();
    const attachment = {
      id: fileId,
      workspaceId,
      storageKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      checksum: hash,
      storageProvider: 'r2storage',
      uploadedBy: uploaderId,
      createdAt: now
    };

    db.data.attachments.set(fileId, attachment);

    return {
      ...attachment,
      downloadUrl: `/api/v1/attachments/${fileId}/download`
    };
  }

  static async listAttachments(workspaceId: string) {
    const list = Array.from(db.data.attachments.values()).filter(
      (a) => a.workspaceId === workspaceId
    );

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list.map((a) => ({
      ...a,
      downloadUrl: `/api/v1/attachments/${a.id}/download`
    }));
  }

  static async getPresignedUrl(workspaceId: string, id: string, expiresInSeconds: number = 3600) {
    const attachment = db.data.attachments.get(id);
    if (!attachment || attachment.workspaceId !== workspaceId) {
      const err: any = new Error('Attachment not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const presignedUrl = await R2StorageClient.getPresignedDownloadUrl(attachment.storageKey, expiresInSeconds);
    return {
      url: presignedUrl || `/api/v1/attachments/${id}/download`,
      expiresInSeconds
    };
  }

  static async getAttachmentFile(workspaceId: string, id: string) {
    const attachment = db.data.attachments.get(id);
    if (!attachment || attachment.workspaceId !== workspaceId) {
      const err: any = new Error('Attachment not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const filePath = path.resolve(config.localStoragePath, attachment.storageKey);

    // If local file exists, serve it
    if (fs.existsSync(filePath)) {
      return {
        metadata: attachment,
        filePath
      };
    }

    // Otherwise retrieve from R2 Storage on mvcdn.cc and populate cache
    const r2Data = await R2StorageClient.getObjectBuffer(attachment.storageKey);
    if (r2Data) {
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, r2Data.buffer);
        return {
          metadata: attachment,
          filePath
        };
      } catch (err) {
        // Return buffer directly if cache write fails
        return {
          metadata: attachment,
          buffer: r2Data.buffer
        };
      }
    }

    const err: any = new Error('Attachment file payload missing from storage');
    err.statusCode = 404;
    err.code = 'FILE_MISSING';
    throw err;
  }

  static async deleteAttachment(workspaceId: string, id: string) {
    const attachment = db.data.attachments.get(id);
    if (!attachment || attachment.workspaceId !== workspaceId) {
      const err: any = new Error('Attachment not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    // 1. Delete from R2 Storage
    await R2StorageClient.deleteObject(attachment.storageKey);

    // 2. Delete local cache if present
    const filePath = path.resolve(config.localStoragePath, attachment.storageKey);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // Ignore cache unlink error
      }
    }

    db.data.attachments.delete(id);
    return { success: true, id };
  }
}
