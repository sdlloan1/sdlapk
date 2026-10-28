import crypto from 'node:crypto';

const SECRET = process.env.SESSION_SECRET || 'sdl-dev-only-session-secret';
const PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const TOKEN_HOURS = 12;

export function checkPassword(input) {
  const given = Buffer.from(String(input ?? ''));
  const expected = Buffer.from(PASSWORD);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export function signToken() {
  const expiresAt = Date.now() + TOKEN_HOURS * 3600 * 1000;
  const signature = crypto.createHmac('sha256', SECRET).update(String(expiresAt)).digest('hex');
  return `${expiresAt}.${signature}`;
}

export function verifyToken(token) {
  const [expiresAt, signature] = String(token || '').split('.');
  if (!expiresAt || !signature || !Number(expiresAt)) return false;
  const expected = crypto.createHmac('sha256', SECRET).update(expiresAt).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b) && Number(expiresAt) > Date.now();
}

export function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyToken(token)) return res.status(401).json({ error: 'Please sign in again.' });
  next();
}

// Very small in-memory brake on password guessing.
const attempts = new Map();
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function tooManyAttempts(ip) {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.first > WINDOW_MS) return false;
  return entry.count >= MAX_ATTEMPTS;
}

export function recordAttempt(ip) {
  const entry = attempts.get(ip);
  if (!entry || Date.now() - entry.first > WINDOW_MS) {
    attempts.set(ip, { first: Date.now(), count: 1 });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(ip) {
  attempts.delete(ip);
}
