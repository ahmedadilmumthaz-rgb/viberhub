import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MediaService } from '../src/services/mediaService.js';
import { R2StorageClient } from '../src/storage/r2Client.js';
import { v4 as uuidv4 } from 'uuid';

describe('Media Library & R2 Storage (mvcdn.cc) Integration', () => {
  const workspaceId = '11111111-1111-1111-1111-111111111111';
  const userId = '00000000-0000-0000-0000-000000000001';

  it('rejects prohibited file extensions with 400 PROHIBITED_FILE_EXTENSION', async () => {
    await assert.rejects(
      async () => {
        await MediaService.uploadFile(workspaceId, userId, {
          originalname: 'malicious.exe',
          mimetype: 'application/octet-stream',
          size: 1024,
          buffer: Buffer.from('binary-content')
        });
      },
      (err: any) => {
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  it('rejects unsupported MIME types', async () => {
    await assert.rejects(
      async () => {
        await MediaService.uploadFile(workspaceId, userId, {
          originalname: 'video.mp4',
          mimetype: 'video/mp4',
          size: 2048,
          buffer: Buffer.from('video-data')
        });
      },
      (err: any) => {
        assert.strictEqual(err.code, 'UNSUPPORTED_MEDIA_TYPE');
        return true;
      }
    );
  });

  it('successfully uploads valid image attachment, records metadata, and caches payload', async () => {
    const testBuffer = Buffer.from('fake-image-png-header-data-123456');
    const attachment = await MediaService.uploadFile(workspaceId, userId, {
      originalname: 'campaign_banner.png',
      mimetype: 'image/png',
      size: testBuffer.length,
      buffer: testBuffer
    });

    assert.ok(attachment.id, 'Attachment must have an ID');
    assert.strictEqual(attachment.originalName, 'campaign_banner.png');
    assert.strictEqual(attachment.mimeType, 'image/png');
    assert.strictEqual(attachment.storageProvider, 'r2storage');
    assert.ok(attachment.downloadUrl.includes(attachment.id));

    // Verify retrieval
    const retrieved = await MediaService.getAttachmentFile(workspaceId, attachment.id);
    assert.strictEqual(retrieved.metadata.id, attachment.id);
    assert.ok(retrieved.filePath, 'Should provide local cached file path');

    // Verify listing
    const list = await MediaService.listAttachments(workspaceId);
    assert.ok(list.some((a) => a.id === attachment.id), 'Attachment must be in workspace attachments list');

    // Verify deletion
    const delRes = await MediaService.deleteAttachment(workspaceId, attachment.id);
    assert.strictEqual(delRes.success, true);
  });

  it('generates presigned download URL structure for R2 storage', async () => {
    const testBuffer = Buffer.from('sample pdf document content');
    const attachment = await MediaService.uploadFile(workspaceId, userId, {
      originalname: 'briefing.pdf',
      mimetype: 'application/pdf',
      size: testBuffer.length,
      buffer: testBuffer
    });

    const presigned = await MediaService.getPresignedUrl(workspaceId, attachment.id, 1800);
    assert.ok(presigned.url, 'Presigned URL must be returned');
    assert.strictEqual(presigned.expiresInSeconds, 1800);

    await MediaService.deleteAttachment(workspaceId, attachment.id);
  });
});
