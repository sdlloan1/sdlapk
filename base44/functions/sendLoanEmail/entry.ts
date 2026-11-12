import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { emailHeader, emailFooter, buildRawMessage } from "../../shared/emailTemplate.ts";

function approvalEmail({ borrowerName, principal, repayment, dueDate, agreementLink }) {
  return `<!DOCTYPE html><html lang="en"><body style="margin:0; padding:0; background-color:#fdf1e9; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf1e9; padding: 30px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius: 12px; overflow:hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
        ${emailHeader()}
        <tr><td style="background-color:#fff4ee; padding: 10px 32px; text-align:center; border-bottom: 1px solid #ffe1d1;">
          <span style="display:inline-block; background-color:#28a745; color:#ffffff; font-size:12px; font-weight:700; padding:4px 14px; border-radius: 20px; letter-spacing: 0.5px;">&#10003; LOAN APPROVED &amp; DISBURSED</span>
        </td></tr>
        <tr><td style="padding: 32px;">
          <p style="font-size:16px; color:#2b2b2b; margin: 0 0 16px 0;">Dear <strong>${borrowerName}</strong>,</p>
          <p style="font-size:15px; color:#4a4a4a; line-height:1.6; margin: 0 0 24px 0;">We are pleased to inform you that your loan has been <strong style="color:#ff4d2e;">approved and successfully disbursed</strong> to your account.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr><td style="background: linear-gradient(135deg, #fff1ea 0%, #ffe3d3 100%); border-radius: 10px; padding: 20px 24px; text-align:center; border: 1px solid #ffd3b8;">
              <div style="font-size:12px; color:#a15c3f; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:6px;">Loan Amount Disbursed</div>
              <div style="font-size:28px; font-weight:800; color:#ff4d2e;">Rs. ${principal}</div>
            </td></tr>
          </table>
          <div style="font-size:15px; font-weight:700; color:#2b2b2b; margin-bottom:12px;">Repayment Details</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ded2; border-radius:8px; overflow:hidden; margin-bottom: 24px;">
            <tr style="background-color:#fff8f4;">
              <td style="padding: 12px 18px; font-size:14px; color:#7a7a7a; border-bottom:1px solid #f0ded2;">Amount Due</td>
              <td style="padding: 12px 18px; font-size:14px; color:#2b2b2b; font-weight:700; text-align:right; border-bottom:1px solid #f0ded2;">Rs. ${repayment}</td>
            </tr>
            <tr>
              <td style="padding: 12px 18px; font-size:14px; color:#7a7a7a;">Due Date</td>
              <td style="padding: 12px 18px; font-size:14px; color:#2b2b2b; font-weight:700; text-align:right;">${dueDate}</td>
            </tr>
          </table>
          <p style="font-size:14px; color:#4a4a4a; line-height:1.6; margin: 0;">Please find the <strong>loan agreement</strong> below for your reference and records. We kindly request you to review it and reach out to us in case of any queries.</p>
        </td></tr>
        ${agreementLink ? `<tr><td style="padding: 0 32px 32px 32px; text-align:center;"><a href="${agreementLink}" style="display:inline-block; background: linear-gradient(135deg, #ff4d2e 0%, #ff8a3d 100%); color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; padding: 12px 32px; border-radius: 30px;">View Loan Agreement</a></td></tr>` : ""}
        ${emailFooter("Thank you for choosing us for your financial needs.")}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function closureEmail({ borrowerName }) {
  return `<!DOCTYPE html><html lang="en"><body style="margin:0; padding:0; background-color:#fdf1e9; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf1e9; padding: 30px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius: 12px; overflow:hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
        ${emailHeader()}
        <tr><td style="background-color:#fff4ee; padding: 10px 32px; text-align:center; border-bottom: 1px solid #ffe1d1;">
          <span style="display:inline-block; background-color:#28a745; color:#ffffff; font-size:12px; font-weight:700; padding:4px 14px; border-radius: 20px; letter-spacing: 0.5px;">&#10003; LOAN REPAID IN FULL</span>
        </td></tr>
        <tr><td style="padding: 32px;">
          <p style="font-size:16px; color:#2b2b2b; margin: 0 0 16px 0;">Dear <strong>${borrowerName}</strong>,</p>
          <p style="font-size:15px; color:#4a4a4a; line-height:1.6; margin: 0 0 24px 0;">We are pleased to confirm that your loan has been <strong style="color:#ff4d2e;">successfully repaid in full</strong>. Thank you for your timely and responsible repayment.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr><td style="background: linear-gradient(135deg, #fff1ea 0%, #ffe3d3 100%); border-radius: 10px; padding: 22px 24px; text-align:center; border: 1px solid #ffd3b8;">
              <div style="font-size:32px; margin-bottom: 6px;">&#127881;</div>
              <div style="font-size:16px; font-weight:800; color:#ff4d2e;">Loan Closed Successfully</div>
              <div style="font-size:13px; color:#a15c3f; margin-top:4px;">Your account is now fully settled</div>
            </td></tr>
          </table>
          <div style="font-size:15px; font-weight:700; color:#2b2b2b; margin-bottom:12px;">What This Means for You</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ded2; border-radius:8px; overflow:hidden; margin-bottom: 24px;">
            <tr style="background-color:#fff8f4;">
              <td style="padding: 16px 18px;">
                <div style="font-size:13px; color:#7a7a7a; margin-bottom:4px;">Credit Limit Status</div>
                <div style="font-size:15px; color:#2b2b2b; font-weight:700;">Updated &#10003; — Improved Eligibility for Future Borrowing</div>
              </td>
            </tr>
          </table>
          <p style="font-size:14px; color:#4a4a4a; line-height:1.6; margin: 0;">We appreciate your continued trust in us and look forward to serving your financial needs again.</p>
        </td></tr>
        ${emailFooter("Thank you for choosing us for your financial needs.")}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { loanId, emailType } = body;
    if (!loanId || !emailType) return Response.json({ error: "loanId and emailType required" }, { status: 400 });

    const loan = await base44.asServiceRole.entities.LoanApplication.get(loanId);
    if (!loan) return Response.json({ error: "Loan not found" }, { status: 404 });

    const borrower = await base44.asServiceRole.entities.User.get(loan.user_id);
    if (!borrower) return Response.json({ error: "Borrower not found" }, { status: 404 });

    // Check if this email flow is enabled
    const settingsList = await base44.asServiceRole.entities.AppSettings.list();
    const appSettings = settingsList[0] || {};
    if (emailType === "closure" && appSettings.closure_email_enabled === false) {
      return Response.json({ success: true, skipped: true, message: "Closure email is disabled" });
    }
    if (emailType !== "closure" && appSettings.loan_email_enabled === false) {
      return Response.json({ success: true, skipped: true, message: "Loan approval email is disabled" });
    }

    const borrowerName = borrower.display_name || borrower.full_name || "User";

    let emailBody, subject;
    if (emailType === "closure") {
      subject = "SDL Loan Repayment Confirmed";
      emailBody = closureEmail({ borrowerName });
    } else {
      subject = "SDL Loan Approved & Disbursed";
      emailBody = approvalEmail({
        borrowerName,
        principal: String(loan.amount),
        repayment: String(loan.repayment_amount),
        dueDate: loan.due_date || "",
        agreementLink: loan.agreement_pdf_url || "",
      });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");
    const rawMessage = buildRawMessage(
      borrower.email,
      "shubhdhanlakshmifund@gmail.com",
      subject,
      emailBody
    );

    const sendRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawMessage }),
      }
    );

    if (!sendRes.ok) {
      const errText = await sendRes.text();
      return Response.json({ error: `Gmail send failed: ${errText}` }, { status: 500 });
    }

    return Response.json({ success: true, sentTo: borrower.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});