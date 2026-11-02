// Shared content builders for the five repayment reminders (email + WhatsApp).
// Used by the daily reminder function so both channels always say the same thing.

import { emailHeader, emailFooter } from "./emailTemplate.ts";

export const REMINDER_STAGES = [
  { id: "t_minus_2", offset: -2, label: "2 days before due date" },
  { id: "t_minus_1", offset: -1, label: "1 day before due date" },
  { id: "due", offset: 0, label: "Due today" },
  { id: "plus_1", offset: 1, label: "1 day overdue" },
  { id: "plus_2", offset: 2, label: "2 days overdue" },
];

export function stageForOffset(offset) {
  const found = REMINDER_STAGES.find((s) => s.offset === offset);
  return found ? found.id : null;
}

export function stageLabel(stage) {
  const found = REMINDER_STAGES.find((s) => s.id === stage);
  return found ? found.label : stage;
}

export function inr(value) {
  return "\u20b9" + (Number(value) || 0).toLocaleString("en-IN");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function prettyDate(dateStr) {
  if (!dateStr) return "-";
  const parts = String(dateStr).slice(0, 10).split("-").map(Number);
  const [y, m, d] = parts;
  if (!y || !m || !d) return String(dateStr);
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
}

function headline(stage, overdueDays) {
  if (stage === "t_minus_2") return "Your loan repayment is due in *2 days*.";
  if (stage === "t_minus_1") return "Your loan repayment is due *tomorrow*.";
  if (stage === "due") return "Your loan repayment is due *today*.";
  return `Your repayment is now *${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue*.`;
}

function plainHeadline(stage, overdueDays) {
  return headline(stage, overdueDays).replace(/\*/g, "");
}

function actionLine(stage, overdueDays) {
  if (overdueDays > 0) return "Please clear the full amount immediately to stop further overdue charges.";
  if (stage === "due") return "Please repay today to keep your loan account in good standing.";
  return "Please keep the repayment amount ready on your due date to avoid overdue charges.";
}

export function reminderSubject(stage, amount, overdueDays) {
  if (overdueDays > 0) return `SDL Overdue Payment — ${inr(amount)} pending`;
  if (stage === "due") return `SDL Repayment Due Today — ${inr(amount)}`;
  if (stage === "t_minus_1") return `SDL Repayment Due Tomorrow — ${inr(amount)}`;
  return `SDL Repayment Reminder — ${inr(amount)} due soon`;
}

export function buildReminderMessage(opts) {
  const {
    stage,
    userName,
    loanCode,
    loanAmount,
    repaymentAmount,
    dueDate,
    overdueDays,
    overdueAmount,
    totalPayable,
    waived = false,
    websiteUrl,
  } = opts;

  const lines = [
    "\ud83e\ude94 *Repayment Reminder* \ud83d\ude4f",
    "",
    `Dear *${userName}*,`,
    "",
    headline(stage, overdueDays),
    "",
    `Loan ID: *${loanCode || "-"}*`,
    `Loan Amount: *${inr(loanAmount)}*`,
    `Repayment Amount: *${inr(repaymentAmount)}*`,
    `Due Date: *${prettyDate(dueDate)}*`,
  ];

  if (overdueDays > 0) {
    lines.push(
      `Overdue Days: *${overdueDays}*`,
      `Overdue Charges: *${waived ? "Waived" : inr(overdueAmount)}*`,
      `Total Payable Now: *${inr(totalPayable)}*`
    );
  }

  lines.push(
    "",
    actionLine(stage, overdueDays),
    "",
    `Visit: ${websiteUrl}`,
    "",
    "Regards,",
    "SDL Team \ud83e\ude94"
  );

  return lines.join("\n");
}

export function buildReminderEmailHtml(opts) {
  const {
    stage,
    userName,
    loanCode,
    loanAmount,
    repaymentAmount,
    dueDate,
    overdueDays,
    overdueAmount,
    totalPayable,
    waived = false,
    websiteUrl,
  } = opts;

  const isOverdue = overdueDays > 0;
  const badge = isOverdue ? "PAYMENT OVERDUE" : stage === "due" ? "PAYMENT DUE TODAY" : "REPAYMENT REMINDER";
  const badgeColor = isOverdue ? "#c62828" : "#e05a1e";

  const overdueRows = isOverdue
    ? `<tr style="background-color:#fff4f4;">
         <td style="padding: 12px 18px; font-size:14px; color:#7a7a7a; border-bottom:1px solid #f0ded2;">Overdue Days</td>
         <td style="padding: 12px 18px; font-size:14px; color:#c62828; font-weight:700; text-align:right; border-bottom:1px solid #f0ded2;">${overdueDays}</td>
       </tr>
       <tr style="background-color:#fff4f4;">
         <td style="padding: 12px 18px; font-size:14px; color:#7a7a7a; border-bottom:1px solid #f0ded2;">Overdue Charges</td>
         <td style="padding: 12px 18px; font-size:14px; color:#c62828; font-weight:700; text-align:right; border-bottom:1px solid #f0ded2;">${waived ? "Waived" : inr(overdueAmount)}</td>
       </tr>`
    : "";

  return `<!DOCTYPE html><html lang="en"><body style="margin:0; padding:0; background-color:#fdf1e9; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf1e9; padding: 30px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius: 12px; overflow:hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
        ${emailHeader()}
        <tr><td style="background-color:#fff4ee; padding: 10px 32px; text-align:center; border-bottom: 1px solid #ffe1d1;">
          <span style="display:inline-block; background-color:${badgeColor}; color:#ffffff; font-size:12px; font-weight:700; padding:4px 14px; border-radius: 20px; letter-spacing: 0.5px;">${badge}</span>
        </td></tr>
        <tr><td style="padding: 32px;">
          <p style="font-size:16px; color:#2b2b2b; margin: 0 0 16px 0;">Dear <strong>${userName}</strong>,</p>
          <p style="font-size:15px; color:#4a4a4a; line-height:1.6; margin: 0 0 24px 0;">${plainHeadline(stage, overdueDays)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr><td style="background: linear-gradient(135deg, #fff1ea 0%, #ffe3d3 100%); border-radius: 10px; padding: 20px 24px; text-align:center; border: 1px solid #ffd3b8;">
              <div style="font-size:12px; color:#a15c3f; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:6px;">${isOverdue ? "Total Payable Now" : "Amount Due"}</div>
              <div style="font-size:28px; font-weight:800; color:#ff4d2e;">${inr(isOverdue ? totalPayable : repaymentAmount)}</div>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ded2; border-radius:8px; overflow:hidden; margin-bottom: 24px;">
            <tr style="background-color:#fff8f4;">
              <td style="padding: 12px 18px; font-size:14px; color:#7a7a7a; border-bottom:1px solid #f0ded2;">Loan ID</td>
              <td style="padding: 12px 18px; font-size:14px; color:#2b2b2b; font-weight:700; text-align:right; border-bottom:1px solid #f0ded2;">${loanCode || "-"}</td>
            </tr>
            <tr>
              <td style="padding: 12px 18px; font-size:14px; color:#7a7a7a; border-bottom:1px solid #f0ded2;">Loan Amount</td>
              <td style="padding: 12px 18px; font-size:14px; color:#2b2b2b; font-weight:700; text-align:right; border-bottom:1px solid #f0ded2;">${inr(loanAmount)}</td>
            </tr>
            <tr style="background-color:#fff8f4;">
              <td style="padding: 12px 18px; font-size:14px; color:#7a7a7a; border-bottom:1px solid #f0ded2;">Repayment Amount</td>
              <td style="padding: 12px 18px; font-size:14px; color:#2b2b2b; font-weight:700; text-align:right; border-bottom:1px solid #f0ded2;">${inr(repaymentAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 18px; font-size:14px; color:#7a7a7a;${isOverdue ? " border-bottom:1px solid #f0ded2;" : ""}">Due Date</td>
              <td style="padding: 12px 18px; font-size:14px; color:#2b2b2b; font-weight:700; text-align:right;${isOverdue ? " border-bottom:1px solid #f0ded2;" : ""}">${prettyDate(dueDate)}</td>
            </tr>
            ${overdueRows}
          </table>
          <p style="font-size:14px; color:#4a4a4a; line-height:1.6; margin: 0 0 24px 0;">${actionLine(stage, overdueDays)}</p>
          <div style="text-align:center;">
            <a href="${websiteUrl}" style="display:inline-block; background: linear-gradient(135deg, #ff4d2e 0%, #ff8a3d 100%); color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; padding: 12px 32px; border-radius: 30px;">Visit SDL</a>
          </div>
        </td></tr>
        ${emailFooter(`Need help? Reach us at ${websiteUrl}`)}
      </table>
    </td></tr>
  </table>
</body></html>`;
}