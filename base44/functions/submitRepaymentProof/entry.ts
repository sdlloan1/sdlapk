const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// A borrower may only ever attach repayment proof to their own open loan.
// Amounts, status transitions to repaid, and waivers stay with the admin.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const loanId = body.loanId;
    if (!loanId) return Response.json({ error: "loanId is required" }, { status: 400 });

    const screenshots = (Array.isArray(body.screenshots) ? body.screenshots : [])
      .slice(0, 10)
      .map((s) => ({ screenshot: String(s?.screenshot || ""), amount: Number(s?.amount) || 0 }))
      .filter((s) => s.screenshot);
    if (!screenshots.length) {
      return Response.json({ error: "At least one payment screenshot is required" }, { status: 400 });
    }

    const loan = await db.asServiceRole.entities.LoanApplication
      .get(loanId)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!loan) return Response.json({ error: "Loan not found" }, { status: 404 });
    if (loan.user_id !== user.id) return Response.json({ error: "Forbidden" }, { status: 403 });
    if (!["disbursed", "overdue"].includes(loan.status)) {
      return Response.json({ error: "This loan is not open for repayment." }, { status: 400 });
    }

    await db.asServiceRole.entities.LoanApplication.update(loanId, {
      repayment_screenshots: JSON.stringify(screenshots),
      repayment_screenshot: screenshots[0].screenshot,
      status: "pending_verification",
    });

    return Response.json({ ok: true, status: "pending_verification" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}