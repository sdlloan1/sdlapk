// Device + approximate location details recorded with app downloads and visits.

export function getDeviceInfo() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  const isTablet = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isMobile = /Android|iPhone|iPod|Mobile|Windows Phone/i.test(ua);
  const device_type = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let device_model = "Unknown device";
  const android = ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build|\))/i);
  if (android && android[1]) device_model = android[1].trim();
  else if (/iPhone/i.test(ua)) device_model = "iPhone";
  else if (/iPad/i.test(ua)) device_model = "iPad";
  else if (/Windows/i.test(ua)) device_model = "Windows PC";
  else if (/Macintosh/i.test(ua)) device_model = "Mac";
  else if (/Linux/i.test(ua)) device_model = "Linux PC";

  let os_version = "";
  const androidVer = ua.match(/Android\s([\d.]+)/i);
  const iosVer = ua.match(/(?:iPhone|iPad)[^)]*OS\s([\d_]+)/i);
  if (androidVer) os_version = `Android ${androidVer[1]}`;
  else if (iosVer) os_version = `iOS ${iosVer[1].replace(/_/g, ".")}`;
  else if (/Windows NT 10/i.test(ua)) os_version = "Windows 10/11";
  else if (/Mac OS X/i.test(ua)) os_version = "macOS";
  else if (/Linux/i.test(ua)) os_version = "Linux";

  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";

  return { device_type, device_model, os_version, browser };
}

// Approximate location from the visitor's IP. Never blocks: returns {} on failure.
export async function getLocation() {
  try {
    const res = await fetch("https://ipwho.is/", { cache: "no-store" });
    if (!res.ok) return {};
    const d = await res.json();
    if (!d || d.success === false) return {};
    return { country: d.country || "", region: d.region || "", city: d.city || "" };
  } catch (e) {
    return {};
  }
}
