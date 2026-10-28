// Preview of the configured website for the dashboard's phone mock.
// The real site sends `X-Frame-Options: DENY`, so it can never be framed directly.
// We fetch its HTML, point its absolute asset URLs at this proxy and let its own scripts
// run inside an <iframe>, so the dashboard shows the real page instead of an empty shell.
import express from 'express';
import { readConfig } from './db.js';

const PREFIX = '/site-preview';
const TIMEOUT_MS = 10000;

export const sitePreview = express.Router();

function toProxy(value) {
  return value.startsWith('/') && !value.startsWith('//') ? `${PREFIX}${value}` : value;
}

function rewriteCss(css) {
  return css.replace(/url\((['"]?)(\/[^'")]*)\1\)/g, (_m, quote, path) => `url(${quote}${toProxy(path)}${quote})`);
}

function rewriteHtml(html) {
  const rewritten = html.replace(
    /\b(href|src|srcset|data-src|poster)="(\/[^"]*)"/g,
    (_m, attr, value) => `${attr}="${toProxy(value)}"`
  );

  // Relative references resolve under the proxy prefix, and the site's own router must
  // see the real path instead of the proxy prefix (otherwise it renders its 404 page).
  const boot = `${PREFIX}/`.replace(/\/$/, '');
  return rewritten.replace(
    /<head([^>]*)>/i,
    `<head$1><base href="${PREFIX}/"><script>(function(){if(location.pathname.indexOf('${boot}')===0){history.replaceState(null,'',location.pathname.slice(${boot.length})||'/');}})();</script>`
  );
}

function pickTarget(config, requestUrl) {
  const base = new URL(config.appUrl);
  const [rawPath, query = ''] = requestUrl.split('?');
  const path = rawPath.slice(PREFIX.length).replace(/^\/+/, '');
  const suffix = query ? `?${query}` : '';

  if (!path) {
    const start = config.startPath.replace(/^\/+/, '');
    return new URL(`/${start}${suffix}`, base);
  }
  return new URL(`/${path}${suffix}`, base);
}

const failure = (message) => `<p style="font:14px system-ui;padding:20px">${message}</p>`;

sitePreview.get(/.*/, async (req, res) => {
  let target;
  try {
    const row = await readConfig();
    target = pickTarget(row.config, req.originalUrl);
  } catch {
    return res.status(502).type('html').send(failure('Preview unavailable.'));
  }

  try {
    const upstream = await fetch(target, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        accept: req.get('accept') || '*/*',
        'user-agent': req.get('user-agent') || 'SDL-dashboard-preview',
      },
    });

    if (!upstream.ok) {
      return res.status(502).type('html').send(failure('The website did not answer.'));
    }

    const type = upstream.headers.get('content-type') || 'application/octet-stream';

    if (type.includes('text/html')) {
      res.set('Cache-Control', 'no-store');
      return res.type('html').send(rewriteHtml(await upstream.text()));
    }

    if (type.includes('text/css')) {
      res.set('Cache-Control', 'public, max-age=300');
      return res.type('css').send(rewriteCss(await upstream.text()));
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    res.set('Cache-Control', 'public, max-age=300');
    res.type(type);
    return res.send(body);
  } catch {
    return res.status(502).type('html').send(failure('The website took too long to answer.'));
  }
});
