import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { emailHeader, emailFooter, buildRawMessage } from "../../shared/emailTemplate.ts";

function limitAssignedEmail({ borrowerName, limit }) {
  return `<!DOCTYPE html><html lang="en"><body style="margin:0; padding:0; background-color:#fdf1e9; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf1e9; padding: 30px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius: 12px; overflow:hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
        ${emailHeader()}
        <tr><td style="background-color:#fff4ee; padding: 10px 32px; text-align:center; border-bottom: 1px solid #ffe1d1;">
          <span style="display:inline-block; background-color:#ff4d2e; color:#ffffff; font-size:12px; font-weight:700; padding:4px 14px; border-radius: 20px; letter-spacing: 0.5px;">&#10003; LOAN LIMIT ASSIGNED</span>
        </td></tr>
        <tr><td style="padding: 32px;">
          <p style="font-size:16px; color:#2b2b2b; margin: 0 0 16px 0;">Dear <strong>${borrowerName}</strong>,</p>
          <p style="font-size:15px; color:#4a4a4a; line-height:1.6; margin: 0 0 24px 0;">Great news! Your KYC verification is complete and your loan limit has now been assigned. You can apply for loans up to the amount below.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr><td style="background: linear-gradient(135deg, #fff1ea 0%, #ffe3d3 100%); border-radius: 10px; padding: 20px 24px; text-align:center; border: 1px solid #ffd3b8;">
              <div style="font-size:12px; color:#a15c3f; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:6px;">Your Approved Loan Limit</div>
              <div style="font-size:28px; font-weight:800; color:#ff4d2e;">Rs. ${limit}</div>
            </td></tr>
          </table>
          <p style="font-size:14px; color:#4a4a4a; line-height:1.6; margin: 0;">Your limit will increase based on your good repayment history. Log in to the SDL app to apply for your first loan.</p>
        </td></tr>
        ${emailFooter("Thank you for choosing us for your financial needs.")}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { userId, limit } = body;
    if (!userId || !limit) return Response.json({ error: "userId and limit required" }, { status: 400 });

    const borrower = await base44.asServiceRole.entities.User.get(userId);
    if (!borrower) return Response.json({ error: "User not found" }, { status: 404 });
    if (!borrower.email) return Response.json({ error: "User has no email address" }, { status: 400 });

    const borrowerName = borrower.display_name || borrower.full_name || "User";
    const subject = "SDL Loan Limit Assigned";
    const emailBody = limitAssignedEmail({ borrowerName, limit: String(limit) });

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
}