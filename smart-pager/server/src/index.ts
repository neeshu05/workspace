import fs from 'node:fs';
import path from 'node:path';
import express, { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { config } from './config';
import { migrate } from './db';
import { startListener } from './events';
import { HttpError } from './orders';
import { purgeExpired } from './push';
import { authRouter } from './routes/auth';
import { customerRouter } from './routes/customer';
import { staffRouter } from './routes/staff';

// Express 4 does not forward rejected promises from async handlers; wrap them.
for (const router of [authRouter, staffRouter, customerRouter]) {
  for (const layer of (router as any).stack) {
    if (!layer.route) continue;
    for (const l of layer.route.stack) {
      const h = l.handle;
      if (h.length <= 2) l.handle = (req: Request, res: Response, next: NextFunction) => Promise.resolve(h(req, res, next)).catch(next);
    }
  }
}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));

app.get('/healthz', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/staff', staffRouter);
app.use('/api/customer', customerRouter);

// In production the API also serves the built web app.
const webDist = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) return res.status(400).json({ error: 'Invalid request', details: err.issues });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
});

async function main() {
  await migrate();
  await startListener();
  setInterval(() => purgeExpired().catch((e) => console.error('purge failed', e)), 3600_000).unref();
  const server = app.listen(config.port, () => console.log(`API listening on :${config.port}`));
  server.timeout = 0; // never cut long-lived SSE responses
  server.keepAliveTimeout = 65_000;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
