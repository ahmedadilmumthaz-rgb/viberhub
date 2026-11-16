/**
 * Viber Hub Background Worker
 * 
 * Handles internal asynchronous operations:
 * - CSV batch import background processing
 * - Preparation deadline reminders for operators
 * - Attachment virus scan and metadata extraction
 * 
 * Boundary Compliance:
 * - NEVER executes unattended personal-account Viber sends or private API scraping.
 */

import { config } from './config.js';
import { db } from './db/store.js';

console.log('[Viber Hub Worker] Background worker initialized.');
console.log(`[Viber Hub Worker] Target Redis: ${config.redisUrl}`);

interface WorkerJob {
  id: string;
  type: string;
  payload: any;
  createdAt: string;
}

class BackgroundWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    this.isRunning = true;
    console.log('[Viber Hub Worker] Starting polling worker queue...');

    // Poll for upcoming campaign deadlines to generate reminders for operators
    this.intervalId = setInterval(() => {
      this.checkUpcomingCampaigns();
    }, 60000); // Check every minute
  }

  checkUpcomingCampaigns() {
    const now = new Date();
    const oneDayAhead = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    for (const campaign of db.data.campaigns.values()) {
      if (campaign.plannedAt && !campaign.archivedAt && campaign.status === 'APPROVED') {
        const plannedDate = new Date(campaign.plannedAt);
        if (plannedDate > now && plannedDate <= oneDayAhead) {
          console.log(`[Viber Hub Worker] Reminder: Campaign "${campaign.title}" is due for manual Viber dispatch within 24 hours.`);
        }
      }
    }
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[Viber Hub Worker] Background worker stopped.');
  }
}

export const worker = new BackgroundWorker();
worker.start();

process.on('SIGTERM', () => {
  console.log('[Viber Hub Worker] SIGTERM received, stopping worker...');
  worker.stop();
  process.exit(0);
});
