const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// SDL shared utility functions

export function upiQrUrl(upiId, amount, name = "SDL Shubh Dahan Lakshmi") {
  let upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}`;
  if (amount) upiString += `&am=${amount}&cu=INR`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiString)}`;
}

// Package-specific Android intent deep link that opens a chosen UPI app (PhonePe, GPay,
// Paytm, CRED...) directly with the payment amount pre-filled.
export function upiAppDeepLink(pkg, upiId, amount, name = "SDL Shubh Dahan Lakshmi", note = "") {
  let params = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}`;
  if (amount) params += `&am=${amount}&cu=INR`;
  if (note) params += `&tn=${encodeURIComponent(note)}`;
  return `intent://pay?${params}#Intent;scheme=upi;package=${pkg};end`;
}

export function formatINR(amount) {
  const num = Number(amount) || 0;
  return "₹" + num.toLocaleString("en-IN");
}

export function calcRepayment(principal, settings = {}) {
  const p = Number(principal) || 0;
  const interestRate = Number(settings.interest_rate) || 3;
  const portalRate = Number(settings.portal_charge_percentage) || 8;
  const processingRate = Number(settings.processing_fee_percentage) || 8;
  const savingsRate = Number(settings.savings_percentage) || 1;

  const interest = Math.round((p * interestRate) / 100);
  const portalCharge = Math.round((p * portalRate) / 100);
  const processingFee = Math.round((p * processingRate) / 100);
  const savingsBack = Math.round((p * savingsRate) / 100);
  const totalCharges = interest + portalCharge + processingFee + savingsBack;

  return {
    principal: p,
    interest,
    portalCharge,
    processingFee,
    savingsBack,
    totalCharges,
    total: p + totalCharges,
  };
}

export function calcOverdue(principal, days, dailyRate = 1) {
  const p = Number(principal) || 0;
  return Math.round((p * days * dailyRate) / 100);
}

// What the borrower has to pay right now: repayment plus any overdue charges,
// unless the admin has waived the overdue charges on that loan.
export function payableTotal(loan, settings = {}) {
  const repayment = Number(loan?.repayment_amount) || 0;
  if (loan?.status !== "disbursed" || loan?.overdue_waived || !isOverdue(loan?.due_date)) {
    return repayment;
  }
  const days = daysOverdue(loan.due_date);
  return repayment + calcOverdue(loan.amount, days, Number(settings?.overdue_daily_rate) || 1);
}

export function getDueDate(salaryDay, fromDate = new Date()) {
  const day = parseInt(salaryDay);
  const loanDay = fromDate.getDate();
  let year = fromDate.getFullYear();
  let month = fromDate.getMonth();
  // If loan taken on or after salary day → repay next month's salary date.
  // If loan taken before salary day → repay same month's salary date.
  if (loanDay >= day) {
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }
  const maxDay = new Date(year, month + 1, 0).getDate();
  const actualDay = Math.min(day, maxDay);
  const due = new Date(year, month, actualDay);
  const m = String(due.getMonth() + 1).padStart(2, "0");
  const d = String(due.getDate()).padStart(2, "0");
  return `${due.getFullYear()}-${m}-${d}`;
}

export function isOverdue(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return today > due;
}

export function daysOverdue(dueDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diff = today - due;
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  let str = String(dateStr);
  // Server timestamps are UTC but may arrive without a 'Z' suffix or offset.
  // Treat them as UTC so the IST display is correct.
  if (!str.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str = str + "Z";
  }
  const d = new Date(str);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatAddress(user) {
  if (!user) return "-";
  const parts = [
    user.address_line1,
    user.address_line2,
    user.city,
    user.state,
    user.pincode,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
}

export function generateLoanId(user) {
  const mobile = (user.mobile_number || "0000").slice(-4);
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const namePart = (user.display_name || user.full_name || "XX").substring(0, 2).toUpperCase();
  const randomDigits = String(Math.floor(1000 + Math.random() * 9000));
  return `SDL${mobile}${dd}${mm}${yyyy}${namePart}${randomDigits}`;
}

export const SDL_LOGO = "https://media.base44.com/images/public/6a65ccde323b932e9e9dc990/b4f7eec46_b088026ec_play-store-icon.png";

// Canonical app domain used for referral links and share previews.
export const APP_DOMAIN = "https://shubhdhanlakshmi.com";

// Admin-configurable shareable domain. Admins can change the host (e.g.
// shubhdhanlakshmi.com) from App Settings; the rest of the referral link stays the same.
export function getShareableDomain(settings) {
  const raw = (settings?.shareable_domain || "shubhdhanlakshmi.com").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${raw}`;
}

// Resolve the active payment payee: the first SDL team member whose UPI is
// enabled, falling back to the admin UPI settings.
export function resolvePayee(teamMembers, settings) {
  const enabled = (teamMembers || []).filter((m) => m.upi_enabled && m.upi_id);
  if (enabled.length > 0) {
    const m = enabled[0];
    return { upiId: m.upi_id, upiName: m.name, memberId: m.id };
  }
  return {
    upiId: settings?.admin_upi_id || "9310601973@ibl",
    upiName: settings?.admin_upi_name || "SDL Shubh Dhan Lakshmi",
    memberId: null,
  };
}

// Download a QR image. Fetches as blob and triggers a save; falls back to
// opening the image in a new tab if the fetch is blocked.
export async function downloadQrImage(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 2000);
  } catch (e) {
    window.open(url, "_blank");
  }
}