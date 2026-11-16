import { Router, Response } from 'express';
import multer from 'multer';
import { MediaService } from '../services/mediaService.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { workspaceMiddleware } from '../middleware/workspace.js';
import { requireEditorOrAbove } from '../middleware/rbac.js';
import { successEnvelope } from '@viberhub/shared';
import { logActivityEvent, logAuditEvent } from '../middleware/audit.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max body size before service inspection
});

const router = Router();
router.use(authMiddleware);
router.use(workspaceMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const list = await MediaService.listAttachments(req.workspaceId!);
    res.json(successEnvelope(list));
  } catch (err) {
    next(err);
  }
});

router.post('/upload', requireEditorOrAbove, uploadRateLimiter, upload.single('file'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { code: 'FILE_REQUIRED', message: 'No file uploaded' }
      });
    }

    const attachment = await MediaService.uploadFile(
      req.workspaceId!,
      req.userId!,
      {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      }
    );

    logActivityEvent(req, 'MEDIA_UPLOADED', 'attachment', attachment.id, {
      name: attachment.originalName,
      size: attachment.sizeBytes
    });
    logAuditEvent(req, 'MEDIA_UPLOADED', 'attachment', attachment.id);

    res.status(201).json(successEnvelope(attachment));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/download', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (req.query.presigned === 'true') {
      const presigned = await MediaService.getPresignedUrl(req.workspaceId!, req.params.id);
      if (presigned.url.startsWith('http')) {
        return res.redirect(presigned.url);
      }
    }

    const result = await MediaService.getAttachmentFile(req.workspaceId!, req.params.id);
    logAuditEvent(req, 'MEDIA_DOWNLOADED', 'attachment', req.params.id);

    res.setHeader('Content-Type', result.metadata.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.metadata.originalName)}"`);

    if (result.filePath) {
      res.sendFile(result.filePath);
    } else if (result.buffer) {
      res.send(result.buffer);
    }
  } catch (err) {
    next(err);
  }
});

router.get('/:id/presigned', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const presigned = await MediaService.getPresignedUrl(req.workspaceId!, req.params.id);
    res.json(successEnvelope(presigned));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireEditorOrAbove, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const result = await MediaService.deleteAttachment(req.workspaceId!, req.params.id);
    logAuditEvent(req, 'MEDIA_DELETED', 'attachment', req.params.id);

    res.json(successEnvelope(result));
  } catch (err) {
    next(err);
  }
});

export const attachmentRoutes = router;
