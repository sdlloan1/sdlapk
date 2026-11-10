const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildRawMessage } from "../../shared/emailTemplate.ts";
import {
  stageForOffset,
  stageLabel,
  buildReminderMessage,
  buildReminderEmailHtml,
  reminderSubject,
} from "../../shared/reminderContent.ts";

const IST = "Asia/Kolkata";
const DEFAULT_WEBSITE = "https://shubhdhanlakshmi.in/";

function istToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function istHour() {
  return Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "2-digit", hour12: false }).format(new Date())
  );
}

function dayDiff(a, b) {
  const toUtc = (s) => {
    const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(a) - toUtc(b)) / 86400000);
}

function chunk(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;
    const dryRun = body?.dryRun === true;

    const settingsList = await db.asServiceRole.entities.AppSettings.list();
    const settings = settingsList[0] || {};
    const websiteUrl = (settings.reminder_website_url || DEFAULT_WEBSITE).trim();
    const emailEnabled = settings.reminder_email_enabled !== false;
    const overdueRate = Number(settings.overdue_daily_rate) || 1;

    const today = istToday();
    const hour = istHour();
    // Reminder emails only leave between 8:00 and 10:59 IST, unless an admin forces a run.
    const withinWindow = hour >= 8 && hour < 11;
    const shouldSendEmail = emailEnabled && !dryRun && (force || withinWindow);

    const loansPage = await db.asServiceRole.entities.LoanApplication.filter(
      { status: { $in: ["disbursed", "overdue"] } },
      { limit: 500 }
    );
    const loans = loansPage.items || [];

    const candidates = [];
    for (const loan of loans) {
      if (!loan.due_date) continue;
      const offset = dayDiff(today, loan.due_date);
      const stage = stageForOffset(offset);
      if (!stage) continue;
      candidates.push({ loan, stage, offset });
    }

    if (candidates.length === 0) {
      return Response.json({ generated: 0, sent: 0, failed: 0, message: "No reminders scheduled for today" });
    }

    const existingPage = await db.asServiceRole.entities.RepaymentReminder.filter(
      { loan_id: { $in: candidates.map((c) => c.loan.id) } },
      { limit: 500 }
    );
    const alreadyCreated = new Set((existingPage.items || []).map((r) => `${r.loan_id}:${r.stage}`));

    const userIds = [...new Set(candidates.map((c) => c.loan.user_id).filter(Boolean))];
    const users = userIds.length
      ? await db.asServiceRole.entities.User.filter({ id: { $in: userIds } })
      : [];
    const userMap = {};
    users.forEach((u) => { userMap[u.id] = u; });

    const records = [];
    for (const { loan, stage, offset } of candidates) {
      if (alreadyCreated.has(`${loan.id}:${stage}`)) continue;
      const borrower = userMap[loan.user_id] || {};
      const overdueDays = Math.max(0, offset);
      const loanAmount = Number(loan.amount) || 0;
      const repaymentAmount = Number(loan.repayment_amount) || 0;
      const overdueAmount = overdueDays && !loan.overdue_waived
        ? Math.round((loanAmount * overdueDays * overdueRate) / 100)
        : 0;
      const userName = borrower.display_name || borrower.full_name || loan.user_name || "User";
      const base = {
        stage,
        userName,
        loanCode: loan.loan_id,
        loanAmount,
        repaymentAmount,
        dueDate: loan.due_date,
        overdueDays,
        overdueAmount,
        totalPayable: repaymentAmount + overdueAmount,
        waived: !!loan.overdue_waived,
        websiteUrl,
      };
      records.push({
        loan_id: loan.id,
        loan_code: loan.loan_id || "",
        user_id: loan.user_id || "",
        user_name: userName,
        user_mobile: loan.user_mobile || borrower.mobile_number || "",
        user_email: borrower.email || "",
        stage,
        stage_label: stageLabel(stage),
        scheduled_for: today,
        due_date: loan.due_date,
        loan_amount: loanAmount,
        repayment_amount: repaymentAmount,
        overdue_days: overdueDays,
        overdue_amount: overdueAmount,
        total_payable: repaymentAmount + overdueAmount,
        whatsapp_message: buildReminderMessage(base),
        email_status: shouldSendEmail && borrower.email ? "pending" : "skipped",
      });
    }

    if (dryRun) {
      return Response.json({
        generated: 0,
        dryRun: true,
        wouldCreate: records.map((r) => ({ loan: r.loan_code, stage: r.stage, email: r.user_email })),
      });
    }

    if (records.length > 0) {
      await db.asServiceRole.entities.RepaymentReminder.bulkCreate(records);
    }

    if (!shouldSendEmail) {
      return Response.json({
        generated: records.length,
        sent: 0,
        failed: 0,
        message: emailEnabled
          ? "Reminder messages are ready. Emails go out only between 8:00 and 10:59 AM IST."
          : "Reminder emails are turned off in settings. WhatsApp messages are ready to copy.",
      });
    }

    const pendingPage = await db.asServiceRole.entities.RepaymentReminder.filter(
      { email_status: { $in: force ? ["pending", "skipped"] : ["pending"] }, scheduled_for: today },
      { sort: "-created_date", limit: 100 }
    );
    const pending = pendingPage.items || [];
    if (pending.length === 0) {
      return Response.json({ generated: records.length, sent: 0, failed: 0, message: "Nothing pending to email" });
    }

    let accessToken = null;
    try {
      const connection = await db.asServiceRole.connectors.getConnection("gmail");
      accessToken = connection.accessToken;
    } catch (e) {
      accessToken = null;
    }

    let sent = 0;
    const failedUpdates = [];
    const sentUpdates = [];

    for (const batch of chunk(pending, 6)) {
      const results = await Promise.allSettled(
        batch.map(async (record) => {
          if (!record.user_email || !accessToken) throw new Error("No recipient email or Gmail connection");
          const base = {
            stage: record.stage,
            userName: record.user_name,
            loanCode: record.loan_code,
            loanAmount: record.loan_amount,
            repaymentAmount: record.repayment_amount,
            dueDate: record.due_date,
            overdueDays: record.overdue_days || 0,
            overdueAmount: record.overdue_amount || 0,
            waived: (record.overdue_days || 0) > 0 && !(record.overdue_amount || 0),
            totalPayable: record.total_payable,
            websiteUrl,
          };
          const raw = buildRawMessage(
            record.user_email,
            "shubhdhanlakshmifund@gmail.com",
            reminderSubject(record.stage, record.total_payable || record.repayment_amount, record.overdue_days || 0),
            buildReminderEmailHtml(base)
          );
          const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ raw }),
            signal: AbortSignal.timeout(15000),
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText.slice(0, 300));
          }
          return record.id;
        })
      );

      results.forEach((result, index) => {
        const record = batch[index];
        if (result.status === "fulfilled") {
          sent += 1;
          sentUpdates.push({ id: record.id, email_status: "sent", email_sent_at: new Date().toISOString() });
        } else {
          failedUpdates.push({
            id: record.id,
            email_status: "failed",
            email_error: String(result.reason?.message || result.reason || "send failed").slice(0, 400),
          });
        }
      });
    }

    if (sentUpdates.length) await db.asServiceRole.entities.RepaymentReminder.bulkUpdate(sentUpdates);
    if (failedUpdates.length) await db.asServiceRole.entities.RepaymentReminder.bulkUpdate(failedUpdates);

    return Response.json({ generated: records.length, sent, failed: failedUpdates.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}