import { base44 } from "@/api/base44Client";
import { formatINR } from "@/lib/sdlUtils";

export const DEFAULT_PAYMENT_APPS = [
  { name: "PhonePe", package: "com.phonepe.app", color: "#5F259F", icon_url: "" },
  { name: "Google Pay", package: "com.google.android.apps.nbu.paisa.user", color: "#1A73E8", icon_url: "" },
  { name: "Paytm", package: "net.one97.paytm", color: "#00B9F1", icon_url: "" },
  { name: "Cred", package: "com.dreamplug.android", color: "#0D1117", icon_url: "" },
];

export function parsePaymentApps(raw) {
  if (!raw) return DEFAULT_PAYMENT_APPS;
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length ? arr : DEFAULT_PAYMENT_APPS;
  } catch {
    return DEFAULT_PAYMENT_APPS;
  }
}

export async function createNotification({ user_id, title, message, type = "system", related_id = "" }) {
  try {
    await base44.entities.Notification.create({ user_id, title, message, type, read: false, related_id });
  } catch (e) {
    // notifications are best-effort
  }
}

// Generate due-date / overdue notifications for a user's active loans (deduped by loan id).
export async function ensureDueDateNotifications(user, loans) {
  try {
    if (!user?.id || !Array.isArray(loans)) return;
    const now = new Date();
    const candidates = loans
      .filter((l) => l.status === "disbursed" && l.due_date)
      .map((l) => {
        const due = new Date(l.due_date + "T00:00:00");
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        return { loan: l, diffDays };
      })
      .filter((x) => x.diffDays <= 3); // due within 3 days or overdue
    if (!candidates.length) return;

    const existing = await base44.entities.Notification.filter({ user_id: user.id }, "-created_date", 100);
    const have = new Set(existing.filter((n) => n.type === "due_date" && n.related_id).map((n) => n.related_id));

    for (const { loan, diffDays } of candidates) {
      if (have.has(loan.id)) continue;
      const title = diffDays < 0 ? "Repayment Overdue" : diffDays === 0 ? "Repayment Due Today" : `Repayment due in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
      const message =
        diffDays < 0
          ? `Your loan repayment of ${formatINR(loan.repayment_amount)} is overdue. Please repay now to avoid extra charges.`
          : `Your loan repayment of ${formatINR(loan.repayment_amount)} is due ${diffDays === 0 ? "today" : `in ${diffDays} day(s)`}. Please repay on time.`;
      await createNotification({ user_id: user.id, title, message, type: "due_date", related_id: loan.id });
    }
  } catch (e) {
    // best-effort
  }
}