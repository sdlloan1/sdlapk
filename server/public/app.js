const $ = (id) => document.getElementById(id);
const state = {
  token: localStorage.getItem('sdl_admin_token') || '',
  config: null,
};

const SHAPES = { rounded: '22%', circle: '50%', square: '0%' };

/** Luminance check so the progress bar stays visible on light or dark backgrounds. */
function isLight(hex) {
  const value = String(hex || '').replace('#', '');
  if (value.length !== 6) return true;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

/* ---------------- API ---------------- */
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(state.token ? { authorization: `Bearer ${state.token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/admin/login') {
      showLogin('Your session ended. Sign in again.');
    }
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

/* ---------------- screens ---------------- */
function showLogin(message) {
  state.token = '';
  localStorage.removeItem('sdl_admin_token');
  $('login').classList.remove('hidden');
  $('panel').classList.add('hidden');
  const error = $('login-error');
  error.hidden = !message;
  error.textContent = message || '';
  $('login-password').focus();
}

function showPanel() {
  $('login').classList.add('hidden');
  $('panel').classList.remove('hidden');
  $('endpoint').textContent = `${location.origin}  (GET /api/config)`;
}

/* ---------------- form <-> config ---------------- */
function fillForm(config) {
  state.config = config;
  $('appUrl').value = config.appUrl;
  $('startPath').value = config.startPath;
  $('splashEnabled').checked = config.splash.enabled;
  $('splashAnimation').value = config.splash.animation;
  $('splashBackground').value = config.splash.background;
  $('splashProgress').checked = config.splash.showProgress;
  $('splashDuration').value = config.splash.durationMs;
  $('apkVersion').value = (config.apk && config.apk.version) || '';
  $('offlineEnabled').checked = config.offline.enabled;
  $('offlineTitle').value = config.offline.title;
  $('offlineMessage').value = config.offline.message;
  $('offlineButtonLabel').value = config.offline.buttonLabel;
  setSegment('logo-shape', config.logo.shape);
  setSegment('logo-fit', config.logo.fit);
  $('logoSize').value = config.logo.sizePercent;
  renderPreview();
}

function readForm() {
  return {
    appUrl: $('appUrl').value.trim(),
    startPath: $('startPath').value.trim() || '/',
    logo: {
      shape: segmentValue('logo-shape'),
      fit: segmentValue('logo-fit'),
      sizePercent: Number($('logoSize').value),
      imageUrl: state.config ? state.config.logo.imageUrl : '',
    },
    splash: {
      enabled: $('splashEnabled').checked,
      animation: $('splashAnimation').value,
      background: $('splashBackground').value,
      showProgress: $('splashProgress').checked,
      durationMs: Number($('splashDuration').value),
    },
    apk: {
      version: $('apkVersion').value.trim(),
    },
    offline: {
      enabled: $('offlineEnabled').checked,
      title: $('offlineTitle').value.trim(),
      message: $('offlineMessage').value.trim(),
      buttonLabel: $('offlineButtonLabel').value.trim(),
    },
  };
}

function setSegment(groupId, value) {
  document.querySelectorAll(`#${groupId} button`).forEach((btn) => {
    btn.classList.toggle('on', btn.dataset.value === value);
    btn.setAttribute('aria-checked', String(btn.dataset.value === value));
  });
}

function segmentValue(groupId) {
  const active = document.querySelector(`#${groupId} button.on`);
  return active ? active.dataset.value : '';
}

/* ---------------- website link ---------------- */
function siteAddress(config) {
  const base = (config.appUrl || '').replace(/\/+$/, '');
  const path = `/${(config.startPath || '/').replace(/^\/+/, '')}`;
  return base ? `${base}${path}` : '';
}

/* ---------------- preview ---------------- */
function renderPreview(play = false) {
  const config = readForm();
  state.config = config;

  const splash = $('splash');
  const logo = $('splash-logo');
  const src = config.logo.imageUrl || '/logo.png';
  if (logo.getAttribute('src') !== src) logo.setAttribute('src', src);
  logo.style.borderRadius = SHAPES[config.logo.shape] || SHAPES.rounded;
  logo.style.objectFit = config.logo.fit;
  logo.style.width = `${config.logo.sizePercent}%`;
  $('logo-size-label').textContent = `(${config.logo.sizePercent}% of screen width)`;

  splash.style.background = config.splash.background;
  const bar = $('splash-progress');
  const lightBackground = isLight(config.splash.background);
  bar.style.background = lightBackground ? 'rgba(0, 0, 0, .12)' : 'rgba(255, 255, 255, .35)';
  bar.firstElementChild.style.background = lightBackground ? '#FF4D3D' : '#fff';
  bar.hidden = !config.splash.showProgress;
  $('splash').hidden = !config.splash.enabled;

  $('logo-thumb').src = src;
  $('logo-thumb').style.borderRadius = SHAPES[config.logo.shape] || SHAPES.rounded;

  const siteUrl = siteAddress(config);
  $('site-url').textContent = siteUrl;
  $('open-site').href = siteUrl || '#';

  $('duration-label').textContent = `(${(config.splash.durationMs / 1000).toFixed(1)}s)`;
  $('offline-preview-title').textContent = config.offline.title;
  $('offline-preview-message').textContent = config.offline.message;
  $('offline-preview-button').textContent = config.offline.buttonLabel || 'Retry';

  if (viewMode === 'site') {
    $('splash').hidden = true;
    $('offline-view').hidden = true;
  } else if (play) {
    playSplash();
  }
}

/* ---------------- launch / website view ---------------- */
let viewMode = 'launch';

function setView(mode) {
  const frame = $('site-frame');
  viewMode = mode;
  if (mode === 'site') {
    frame.src = `/site-preview/?t=${Date.now()}`;
    frame.hidden = false;
    $('splash').hidden = true;
    $('offline-view').hidden = true;
  } else {
    frame.hidden = true;
    frame.src = 'about:blank';
    renderPreview();
    playSplash();
  }
  $('view-launch').classList.toggle('on', mode === 'launch');
  $('view-site').classList.toggle('on', mode === 'site');
}

function playSplash() {
  const splash = $('splash');
  const animation = $('splashAnimation').value;
  splash.classList.remove('anim-fade', 'anim-zoom', 'anim-slide');
  void splash.offsetWidth; // restart the animation
  if (animation !== 'none') splash.classList.add(`anim-${animation}`);
}

/* ---------------- save ---------------- */
function setStatus(text, bad = false) {
  const status = $('status');
  status.textContent = text;
  status.classList.toggle('bad', bad);
  status.hidden = false;
  clearTimeout(setStatus.timer);
  setStatus.timer = setTimeout(() => { status.hidden = true; }, 4000);
}

function showSaved(updatedAt) {
  const when = updatedAt ? new Date(updatedAt) : new Date();
  $('saved-at').textContent = `Saved ${when.toLocaleString()}`;
}

async function save() {
  const button = $('save');
  button.disabled = true;
  try {
    const data = await api('/api/admin/config', {
      method: 'PUT',
      body: JSON.stringify({ config: readForm() }),
    });
    fillForm(data.config);
    showSaved(data.updatedAt);
    setStatus('Saved');
  } catch (err) {
    setStatus(err.message || 'Could not save', true);
  } finally {
    button.disabled = false;
  }
}

/* ---------------- logo upload ---------------- */
async function handleLogoFile(file) {
  if (!file) return;
  const bitmap = await createImageBitmap(file);
  const max = 512;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/png');
  if (dataUrl.length > 600000) {
    setStatus('That image is too large — use one under 400 KB.', true);
    return;
  }
  state.config.logo.imageUrl = dataUrl;
  renderPreview(true);
  setStatus('Logo updated — press Save', true);
}

/* ---------------- notifications ---------------- */
async function loadNotifications() {
  const list = $('notif-list');
  try {
    const data = await api('/api/admin/notifications');
    list.innerHTML = '';
    if (!data.notifications.length) {
      list.innerHTML = '<li class="muted small">Nothing sent yet.</li>';
      return;
    }
    data.notifications.forEach((item) => {
      const li = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = item.title;
      const meta = document.createElement('span');
      meta.className = 'muted small';
      meta.textContent = `${new Date(item.created_at).toLocaleString()} · ${item.message}`;
      li.append(title, meta);
      list.appendChild(li);
    });
  } catch (err) {
    list.innerHTML = '<li class="muted small">Could not load sent messages.</li>';
  }
}

async function sendNotification() {
  const button = $('notif-send');
  const title = $('notifTitle').value.trim();
  const message = $('notifMessage').value.trim();
  const link = $('notifLink').value.trim();
  if (!title || !message) {
    setStatus('Add a notification title and message', true);
    return;
  }
  button.disabled = true;
  try {
    await api('/api/admin/notifications', {
      method: 'POST',
      body: JSON.stringify({ title, message, link }),
    });
    $('notifTitle').value = '';
    $('notifMessage').value = '';
    $('notifLink').value = '';
    $('notif-status').textContent = 'Sent';
    setStatus('Notification sent');
    await loadNotifications();
  } catch (err) {
    setStatus(err.message || 'Could not send', true);
  } finally {
    button.disabled = false;
  }
}

/* ---------------- linked Base44 app ---------------- */
async function loadBase44(source) {
  const status = $('b44-status');
  const list = $('b44-list');
  const select = $('b44-source');
  status.classList.remove('error');
  status.textContent = 'Loading…';
  try {
    const data = await api(`/api/admin/base44?source=${encodeURIComponent(source || '')}`);
    if (select.options.length !== data.sources.length) {
      select.innerHTML = '';
      data.sources.forEach((item) => select.add(new Option(item.label, item.key)));
    }
    select.value = data.source;
    list.innerHTML = '';
    $('b44-hint').hidden = data.linked;
    if (!data.linked) {
      status.textContent = 'Not linked yet — add a Base44 API key secret named BASE44_API_KEY.';
      return;
    }
    status.textContent = `Linked to ${data.host} · read-only`;
    if (!data.rows.length) {
      list.innerHTML = '<li class="muted small">No records yet.</li>';
      return;
    }
    data.rows.forEach((row) => {
      const li = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = row.title;
      const meta = document.createElement('span');
      meta.className = 'muted small';
      meta.textContent = row.meta;
      li.append(title, meta);
      list.appendChild(li);
    });
  } catch (err) {
    status.classList.add('error');
    status.textContent = err.message || 'Could not reach your Base44 app.';
  }
}

/* ---------------- boot ---------------- */
async function loadConfig() {
  const data = await api('/api/admin/config');
  fillForm(data.config);
  showSaved(data.updatedAt);
  showPanel();
  playSplash();
  loadNotifications();
  loadBase44('loans');
}

async function boot() {
  $('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('login-error').hidden = true;
    try {
      const data = await api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password: $('login-password').value }),
      });
      state.token = data.token;
      localStorage.setItem('sdl_admin_token', data.token);
      $('login-password').value = '';
      await loadConfig();
    } catch (err) {
      showLogin(err.message);
    }
  });

  $('save').addEventListener('click', save);
  $('notif-send').addEventListener('click', sendNotification);
  $('b44-refresh').addEventListener('click', () => loadBase44($('b44-source').value));
  $('b44-source').addEventListener('change', () => loadBase44($('b44-source').value));
  $('logout').addEventListener('click', () => showLogin());
  $('view-launch').addEventListener('click', () => setView('launch'));
  $('view-site').addEventListener('click', () => setView('site'));
  $('toggle-offline').addEventListener('click', () => {
    if (viewMode === 'site') setView('launch');
    $('offline-view').hidden = !$('offline-view').hidden;
  });

  document.querySelectorAll('#logo-shape button, #logo-fit button').forEach((button) => {
    button.addEventListener('click', () => {
      setSegment(button.parentElement.id, button.dataset.value);
      renderPreview();
    });
  });

  document.querySelectorAll('#path-chips button').forEach((button) => {
    button.addEventListener('click', () => {
      $('startPath').value = button.dataset.path;
      renderPreview();
    });
  });

  $('logo-file').addEventListener('change', (event) => handleLogoFile(event.target.files[0]));
  $('logo-reset').addEventListener('click', () => {
    state.config.logo.imageUrl = '';
    renderPreview();
  });

  $('form').addEventListener('input', () => renderPreview());
  $('form').addEventListener('change', () => renderPreview());
  $('splashAnimation').addEventListener('change', () => renderPreview(true));

  if (!state.token) return showLogin();
  try {
    await loadConfig();
  } catch (err) {
    showLogin(err.message);
  }
}

boot();
