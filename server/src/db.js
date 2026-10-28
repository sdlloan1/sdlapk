import pg from 'pg';
import { DEFAULT_CONFIG } from './defaults.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  // Render's external database URL needs SSL; the internal URL does not.
  ssl: process.env.DATABASE_SSL === '1' ? { rejectUnauthorized: false } : undefined,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_config (
      id integer PRIMARY KEY,
      config jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT app_config_single_row CHECK (id = 1)
    )
  `);
  await pool.query(
    'INSERT INTO app_config (id, config) VALUES (1, $1) ON CONFLICT (id) DO NOTHING',
    [JSON.stringify(DEFAULT_CONFIG)]
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id serial PRIMARY KEY,
      title text NOT NULL,
      message text NOT NULL,
      link text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function readConfig() {
  const { rows } = await pool.query('SELECT config, updated_at FROM app_config WHERE id = 1');
  return rows[0];
}

export async function writeConfig(config) {
  const { rows } = await pool.query(
    'UPDATE app_config SET config = $1, updated_at = now() WHERE id = 1 RETURNING config, updated_at',
    [JSON.stringify(config)]
  );
  return rows[0];
}

export async function insertNotification({ title, message, link = '' }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (title, message, link) VALUES ($1, $2, $3)
     RETURNING id, title, message, link, created_at`,
    [title, message, link]
  );
  return rows[0];
}

/** Messages newer than the phone's last seen id, oldest first. */
export async function notificationsAfter(id) {
  const { rows } = await pool.query(
    `SELECT id, title, message, link, created_at FROM notifications
     WHERE id > $1 ORDER BY id ASC LIMIT 10`,
    [id]
  );
  return rows;
}

export async function listNotifications(limit = 20) {
  const { rows } = await pool.query(
    `SELECT id, title, message, link, created_at FROM notifications
     ORDER BY id DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function closeDb() {
  await pool.end();
}
