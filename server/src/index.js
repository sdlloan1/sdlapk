import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { initDb, readConfig, writeConfig } from './db.js';
import { normalizeConfig } from './defaults.js';
import { sitePreview } from './proxy.js';
import {
  checkPassword,
  clearAttempts,
  recordAttempt,
  requireAdmin,
  signToken,
  tooManyAttempts,
} from './auth.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dashboardDir = path.join(here, '..', 'public');
const downloadDir = path.join(here, '..', '..', 'site');
const port = Number(process.env.PORT || 3000);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

// --- public API: what the Android app reads at launch ---
app.get('/api/config', async (_req, res, next) => {
  try {
    const row = await readConfig();
    res.set('Cache-Control', 'no-store');
    res.json({ config: normalizeConfig(row.config), updatedAt: row.updated_at });
  } catch (err) {
    next(err);
  }
});

// --- admin API ---
app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || 'unknown';
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  }
  if (!checkPassword(req.body?.password)) {
    recordAttempt(ip);
    return res.status(401).json({ error: 'Wrong password.' });
  }
  clearAttempts(ip);
  res.json({ token: signToken() });
});

app.get('/api/admin/config', requireAdmin, async (_req, res, next) => {
  try {
    const row = await readConfig();
    res.json({ config: normalizeConfig(row.config), updatedAt: row.updated_at });
  } catch (err) {
    next(err);
  }
});

app.put('/api/admin/config', requireAdmin, async (req, res, next) => {
  try {
    const config = normalizeConfig(req.body?.config);
    const row = await writeConfig(config);
    res.json({ config: row.config, updatedAt: row.updated_at });
  } catch (err) {
    next(err);
  }
});

// --- static: website snapshot for the preview, download page, dashboard ---
app.use('/site-preview', sitePreview);
app.use('/download', express.static(downloadDir, { maxAge: 0 }));
app.use(express.static(dashboardDir, { maxAge: 0 }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

async function start() {
  await initDb();
  app.listen(port, '0.0.0.0', () => {
    console.log(`SDL admin dashboard on http://0.0.0.0:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
