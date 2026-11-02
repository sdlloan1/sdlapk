import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { API_BASE_URL } from '@/lib/apiBase';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Same-origin client: /api requests go to the Base44 backend of the app's
// deployed URL (and to the dev-server proxy while running locally). The
// packaged Android app sets VITE_BASE44_API_BASE_URL because there is no
// same-origin backend inside the WebView.
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: API_BASE_URL,
  requiresAuth: false,
  appBaseUrl,
});

// Application code reads the client from this global. Only fill it in when the
// host platform has not injected its own client yet (local dev / preview).
if (typeof globalThis !== 'undefined' && !globalThis.__B44_DB__) {
  globalThis.__B44_DB__ = base44;
}

export const db = base44;
export default base44;
