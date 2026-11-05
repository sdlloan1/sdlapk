import { Capacitor } from "@capacitor/core";

const db = globalThis.__B44_DB__;

const SESSION_KEY = "sdl_session_id";
const VIEW_PREFIX = "sdl_pv:";

// The traffic dashboards read the AppEvent/AppDownload entities, which are
// written by the trackEvent/trackDownload backend functions. An environment
// whose backend does not have those artifacts yet (the preview runs against the
// app's hosted backend) would answer every beacon with 404, so set
// VITE_APP_TRAFFIC_ENABLED=false there and the calls are skipped entirely.
export const isTrafficTrackingEnabled =
  import.meta.env.VITE_APP_TRAFFIC_ENABLED !== "false";

const platform = () => {
  try {
    return Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "web";
  } catch {
    return "web";
  }
};

export const sessionId = () => {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
};

// One AppEvent per page per session; failures never touch the UI.
export const trackPageView = (page) => {
  if (!isTrafficTrackingEnabled) return;
  try {
    const key = VIEW_PREFIX + page;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* storage blocked — still record the view */
  }
  db?.functions
    ?.invoke("trackEvent", { page, platform: platform(), session_id: sessionId() })
    .catch(() => {});
};

export const trackDownload = (source, fileName) => {
  if (!isTrafficTrackingEnabled) return;
  db?.functions
    ?.invoke("trackDownload", {
      source,
      file_name: fileName || "",
      platform: "android",
      referrer: typeof document !== "undefined" ? document.referrer : "",
    })
    .catch(() => {});
};
