import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

// Human-readable browser/OS details for the customer profile card. A browser
// only exposes this through the user-agent string, so the parsing lives here.
const BROWSERS = [
  [/SamsungBrowser\/([\d.]+)/, "Samsung Internet"],
  [/OPR\/([\d.]+)/, "Opera"],
  [/EdgA?\/([\d.]+)/, "Edge"],
  [/Firefox\/([\d.]+)/, "Firefox"],
  [/Chrome\/([\d.]+)/, "Chrome"],
  [/Version\/([\d.]+).*Safari/, "Safari"],
];

const major = (version) => String(version).split(".")[0];

export const describeBrowser = (ua = "") => {
  const webview = /;\s*wv\)/.test(ua);
  for (const [pattern, name] of BROWSERS) {
    const match = ua.match(pattern);
    if (match) return `${name}${webview ? " WebView" : ""} ${major(match[1])}`;
  }
  return "Unknown";
};

export const describeOS = (ua = "") => {
  const android = ua.match(/Android\s+([\d.]+)/);
  if (android) return `Android ${android[1]}`;
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  const windows = ua.match(/Windows NT ([\d.]+)/);
  if (windows) return windows[1] === "10.0" ? "Windows 10/11" : `Windows ${windows[1]}`;
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
};

// The installed APK's versionName (build is its versionCode); empty in a browser.
export const getAppVersion = async () => {
  if (!Capacitor.isNativePlatform()) return "";
  try {
    const { appVersion, build } = await App.getInfo();
    return build ? `${appVersion} (${build})` : appVersion || "";
  } catch {
    return "";
  }
};

export const getDeviceInfo = () => {
  const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
  const native = Capacitor.isNativePlatform();
  const screen =
    typeof window !== "undefined" && window.screen
      ? `${window.screen.width} × ${window.screen.height} · ${window.devicePixelRatio || 1}x`
      : "";
  let timezone = "";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    /* no Intl — leave it out */
  }
  return {
    native,
    platform: native ? (Capacitor.getPlatform() === "android" ? "Android app" : "iOS app") : "Web browser",
    browser: describeBrowser(ua),
    os: describeOS(ua),
    screen,
    language: [navigator.language, timezone].filter(Boolean).join(" · "),
  };
};
