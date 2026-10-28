// The app configuration the Android client reads at launch.
// This is also the shape returned by GET /api/config.
export const DEFAULT_CONFIG = {
  appUrl: 'https://shubhdhanlakshmi-beta-version.base44.app',
  startPath: '/',
  logo: {
    shape: 'rounded', // rounded | circle | square
    fit: 'cover', // cover | contain
    sizePercent: 32, // logo width on the launch screen, % of screen width
    imageUrl: '', // data URL uploaded from the dashboard; empty = bundled logo
  },
  splash: {
    enabled: true,
    animation: 'zoom', // none | fade | zoom | slide
    background: '#FFFFFF',
    showProgress: true,
    durationMs: 1500,
  },
  apk: {
    version: '1.2', // label shown on the download page and in the dashboard
  },
  offline: {
    enabled: true,
    title: "You're offline",
    message: 'Check your internet connection and try again.',
    buttonLabel: 'Retry',
  },
};

export const SHAPES = ['rounded', 'circle', 'square'];
export const FITS = ['cover', 'contain'];
export const ANIMATIONS = ['none', 'fade', 'zoom', 'slide'];

const MAX_LOGO_CHARS = 700000; // ~500 KB image as a data URL

function text(value, fallback, max) {
  return typeof value === 'string' ? value.slice(0, max) : fallback;
}

function flag(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function color(value, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : fallback;
}

// Coerce whatever the dashboard sent into a valid config.
export function normalizeConfig(input) {
  const d = DEFAULT_CONFIG;
  const c = input && typeof input === 'object' ? input : {};
  const logo = c.logo && typeof c.logo === 'object' ? c.logo : {};
  const splash = c.splash && typeof c.splash === 'object' ? c.splash : {};
  const offline = c.offline && typeof c.offline === 'object' ? c.offline : {};
  const apk = c.apk && typeof c.apk === 'object' ? c.apk : {};
  const startPath = text(c.startPath, d.startPath, 200);
  const duration = Number(splash.durationMs);

  return {
    appUrl: /^https?:\/\/[^\s]+$/.test(c.appUrl || '') ? c.appUrl : d.appUrl,
    startPath: startPath.startsWith('/') ? startPath : '/',
    logo: {
      shape: pick(logo.shape, SHAPES, d.logo.shape),
      fit: pick(logo.fit, FITS, d.logo.fit),
      sizePercent: Number.isFinite(Number(logo.sizePercent))
        ? Math.min(Math.max(Math.round(Number(logo.sizePercent)), 15), 80)
        : d.logo.sizePercent,
      imageUrl: typeof logo.imageUrl === 'string' && logo.imageUrl.length <= MAX_LOGO_CHARS
        ? logo.imageUrl
        : '',
    },
    splash: {
      enabled: flag(splash.enabled, d.splash.enabled),
      animation: pick(splash.animation, ANIMATIONS, d.splash.animation),
      background: color(splash.background, d.splash.background),
      showProgress: flag(splash.showProgress, d.splash.showProgress),
      durationMs: Number.isFinite(duration) ? Math.min(Math.max(Math.round(duration), 0), 5000) : d.splash.durationMs,
    },
    apk: {
      version: text(apk.version, d.apk.version, 24).trim() || d.apk.version,
    },
    offline: {
      enabled: flag(offline.enabled, d.offline.enabled),
      title: text(offline.title, d.offline.title, 60),
      message: text(offline.message, d.offline.message, 200),
      buttonLabel: text(offline.buttonLabel, d.offline.buttonLabel, 24),
    },
  };
}
