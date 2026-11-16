import { app } from './app.js';
import { config } from './config.js';

const server = app.listen(config.port, () => {
  console.log(`[Viber Hub API] Service listening on port ${config.port} (${config.env} mode)`);
  console.log(`[Viber Hub API] Public API URL: ${config.apiPublicUrl}`);
  console.log(`[Viber Hub API] Health checks: /healthz, /readyz`);
});

process.on('SIGTERM', () => {
  console.log('[Viber Hub API] SIGTERM received, closing HTTP server gracefully...');
  server.close(() => {
    console.log('[Viber Hub API] HTTP server closed.');
    process.exit(0);
  });
});
