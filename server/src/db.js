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

export async function closeDb() {
  await pool.end();
}
