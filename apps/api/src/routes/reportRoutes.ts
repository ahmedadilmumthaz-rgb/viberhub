import { Router, Response } from 'express';
import { ReportService } from '../services/reportService.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { workspaceMiddleware } from '../middleware/workspace.js';
import { successEnvelope } from '@viberhub/shared';
import { logAuditEvent } from '../middleware/audit.js';

const router = Router();
router.use(authMiddleware);
router.use(workspaceMiddleware);

router.get('/overview', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const metrics = await ReportService.getOverviewMetrics(req.workspaceId!);
    res.json(successEnvelope(metrics));
  } catch (err) {
    next(err);
  }
});

router.get('/campaigns', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const report = await ReportService.getCampaignReport(req.workspaceId!);
    res.json(successEnvelope(report));
  } catch (err) {
    next(err);
  }
});

router.get('/export', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const report = await ReportService.getCampaignReport(req.workspaceId!);
    logAuditEvent(req, 'REPORT_EXPORTED', 'workspace', req.workspaceId!);

    const headers = ['Campaign ID', 'Title', 'Status', 'Total Items', 'Completed Manually', 'Planned At', 'Created At'];
    const rows = report.map((r) => [
      r.id,
      `"${r.title.replace(/"/g, '""')}"`,
      r.status,
      r.totalItems,
      r.completedManually,
      r.plannedAt || '',
      r.createdAt
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="viberhub_campaign_report.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

export const reportRoutes = router;
