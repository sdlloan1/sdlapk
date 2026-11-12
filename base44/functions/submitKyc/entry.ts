import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Fields a borrower may supply about themselves during KYC.
// Anything financial or administrative (kyc_status, loan_limit, account_status,
// attempts, partner_status) is set by this function, never taken from the client.
const KYC_FIELDS = [
  "full_name", "display_name", "mobile_number", "pan_number", "upi_id", "salary_date",
  "salary_date_set_date", "salary_slip_updated_date", "referrer_name", "referrer_mobile",
  "address_line1", "address_line2", "city", "state", "pincode",
  "pan_card_image", "aadhaar_front_image", "aadhaar_back_image", "salary_slip_image",
  "additional_documents",
];

const REQUIRED = [
  "full_name", "mobile_number", "pan_number", "upi_id", "salary_date",
  "pan_card_image", "aadhaar_front_image", "aadhaar_back_image", "salary_slip_image",
];

// Dates are tracked in IST so the daily attempt window matches what the user sees.
function istDate(offsetMs = 0) {
  return new Date(Date.now() + 19800000 + offsetMs).toISOString().split("T")[0];
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // Re-apply after a rejection or hold — only the status moves, details are unchanged.
    if (body.reapply) {
      if (!["rejected", "hold"].includes(user.kyc_status || "")) {
        return Response.json({ error: "Re-apply is only available after a rejection." }, { status: 400 });
      }
      await base44.asServiceRole.entities.User.update(user.id, {
        kyc_status: "pending",
        rejection_reason: "",
      });
      return Response.json({ ok: true, kyc_status: "pending" });
    }

    if (user.kyc_status === "approved") {
      return Response.json({ error: "Your KYC is already approved." }, { status: 400 });
    }

    const today = istDate(0);
    const tomorrow = istDate(86400000);
    const blockedUntil = user.kyc_blocked_until || "";
    const attempts = user.kyc_attempt_date === today ? Number(user.kyc_attempt_count) || 0 : 0;

    if (blockedUntil && today < blockedUntil) {
      return Response.json({ error: `KYC submissions are blocked until ${blockedUntil}.` }, { status: 429 });
    }

    const settingsList = await base44.asServiceRole.entities.AppSettings.list();
    const dailyLimit = Number(settingsList?.[0]?.kyc_daily_limit) || 3;

    if (attempts >= dailyLimit) {
      await base44.asServiceRole.entities.User.update(user.id, { kyc_blocked_until: tomorrow });
      return Response.json({ error: `You have used all ${dailyLimit} KYC attempts for today.` }, { status: 429 });
    }

    const patch = {};
    for (const key of KYC_FIELDS) {
      if (body[key] !== undefined && body[key] !== null) patch[key] = body[key];
    }

    for (const key of REQUIRED) {
      if (!patch[key]) return Response.json({ error: `${key} is required` }, { status: 400 });
    }

    const pan = String(patch.pan_number).trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      return Response.json({ error: "Enter a valid PAN number." }, { status: 400 });
    }
    if (!/^\d{10}$/.test(String(patch.mobile_number))) {
      return Response.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    // A mobile number belongs to one account only, so it cannot be claimed to
    // inherit someone else's referral network.
    const mobile = String(patch.mobile_number);
    if (mobile !== String(user.mobile_number || "")) {
      const mobileTaken = await base44.asServiceRole.entities.User.filter({ mobile_number: mobile });
      if (mobileTaken.some((u) => u.id !== user.id)) {
        return Response.json({ error: "This mobile number is already registered." }, { status: 400 });
      }
    }

    // Resolve the referrer server-side to a real user id — the mobile number the
    // client sends is never trusted as an identity key.
    let referrerId = user.referrer_id || "";
    const referrerMobile = String(patch.referrer_mobile || "").trim();
    if (referrerMobile) {
      const referrers = await base44.asServiceRole.entities.User.filter({ mobile_number: referrerMobile });
      const referrer = referrers.find((u) => u.id !== user.id);
      if (referrer) referrerId = referrer.id;
    }
    if (!/^\d{1,2}$/.test(String(patch.salary_date))) {
      return Response.json({ error: "Enter a valid salary date." }, { status: 400 });
    }

    const nextCount = attempts + 1;
    const update = {
      ...patch,
      pan_number: pan,
      referrer_id: referrerId,
      salary_date: Number(patch.salary_date),
      kyc_status: "pending",
      registration_complete: true,
      kyc_attempt_count: nextCount,
      kyc_attempt_date: today,
    };
    if (nextCount >= dailyLimit) update.kyc_blocked_until = tomorrow;

    await base44.asServiceRole.entities.User.update(user.id, update);

    return Response.json({
      ok: true,
      kyc_status: "pending",
      attempts_left: Math.max(0, dailyLimit - nextCount),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}