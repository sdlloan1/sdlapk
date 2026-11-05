import { Capacitor } from "@capacitor/core";

const db = globalThis.__B44_DB__;

const SESSION_KEY = "sdl_session_id";
const VIEW_PREFIX = "sdl_pv:";

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
  db?.functions
    ?.invoke("trackDownload", {
      source,
      file_name: fileName || "",
      platform: "android",
      referrer: typeof document !== "undefined" ? document.referrer : "",
    })
    .catch(() => {});
};
