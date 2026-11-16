import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { workspaceRoutes } from './workspaceRoutes.js';
import { contactRoutes } from './contactRoutes.js';
import { destinationRoutes } from './destinationRoutes.js';
import { templateRoutes } from './templateRoutes.js';
import { attachmentRoutes } from './attachmentRoutes.js';
import { campaignRoutes } from './campaignRoutes.js';
import { plannerRoutes } from './plannerRoutes.js';
import { activityRoutes } from './activityRoutes.js';
import { reportRoutes } from './reportRoutes.js';
import { settingsRoutes } from './settingsRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/workspaces', workspaceRoutes);
apiRouter.use('/contacts', contactRoutes);
apiRouter.use('/destinations', destinationRoutes);
apiRouter.use('/templates', templateRoutes);
apiRouter.use('/attachments', attachmentRoutes);
apiRouter.use('/campaigns', campaignRoutes);
apiRouter.use('/planner', plannerRoutes);
apiRouter.use('/activity', activityRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/accounts', settingsRoutes);

export { apiRouter };
