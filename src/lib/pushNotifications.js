import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// The app has no push provider (FCM) configured, so notifications are raised
// locally from the Notification records the app already creates. That shows a
// real Android notification (sound, vibration, lock screen) while the app runs
// or is in the background; a notification sent while the app is fully closed
// appears the next time the app opens.

const CHANNEL_ID = "sdl-notifications";
const seenKey = (userId) => `sdl_push_seen_${userId}`;
const primedKey = (userId) => `sdl_push_primed_${userId}`;

const hashCode = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash) || 1;
};

const readSeen = (userId) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(seenKey(userId)) || "[]"));
  } catch {
    return new Set();
  }
};

const writeSeen = (userId, seen) => {
  try {
    localStorage.setItem(seenKey(userId), JSON.stringify([...seen].slice(-300)));
  } catch {
    // storage is best-effort
  }
};

export const isNative = () => Capacitor.isNativePlatform();

export async function initPushNotifications() {
  if (!isNative()) return false;
  try {
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: "SDL Updates",
      description: "Loan, repayment and wallet updates",
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: "#FF6B35",
    });
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== "granted") await LocalNotifications.requestPermissions();
    return true;
  } catch {
    return false;
  }
}

// Raises an Android notification for each unread Notification record not shown yet.
export async function pushNewNotifications(userId, notifications) {
  if (!isNative() || !userId || !Array.isArray(notifications)) return 0;

  const seen = readSeen(userId);
  const fresh = notifications.filter((n) => n?.id && !seen.has(n.id));

  // First launch on this device: remember the existing backlog instead of
  // firing it all at once.
  if (localStorage.getItem(primedKey(userId)) !== "1") {
    fresh.forEach((n) => seen.add(n.id));
    writeSeen(userId, seen);
    localStorage.setItem(primedKey(userId), "1");
    return 0;
  }

  if (!fresh.length) return 0;

  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === "granted") {
      await LocalNotifications.schedule({
        notifications: fresh.slice(0, 5).map((n) => ({
          id: hashCode(n.id),
          title: n.title || "SDL",
          body: n.message || "",
          channelId: CHANNEL_ID,
          group: "sdl",
        })),
      });
    }
  } catch {
    return 0;
  }

  fresh.forEach((n) => seen.add(n.id));
  writeSeen(userId, seen);
  return fresh.length;
}
