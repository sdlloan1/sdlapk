import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildRawMessage(to: string, from: string, subject: string, htmlBody: string): string {
  const encodedSubject = /[^\x00-\x7F]/.test(subject)
    ? `=?utf-8?B?${base64UrlEncode(subject)}?=`
    : subject;
  const mime = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    htmlBody,
  ].join("\r\n");
  return base64UrlEncode(mime);
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { recipientType, userId, subject, htmlBody, fromName } = body;
    if (!recipientType || !subject || !htmlBody) {
      return Response.json({ error: "recipientType, subject, and htmlBody are required" }, { status: 400 });
    }

    // Resolve recipients based on type
    let recipients: { email: string; name: string }[] = [];

    if (recipientType === "single") {
      if (!userId) return Response.json({ error: "userId required for single recipient" }, { status: 400 });
      const u = await base44.asServiceRole.entities.User.get(userId);
      if (u && u.email) {
        recipients = [{ email: u.email, name: u.display_name || u.full_name || "User" }];
      }
    } else if (recipientType === "kyc_incomplete") {
      const users = await base44.asServiceRole.entities.User.filter({
        kyc_status: { $nin: ["approved"] },
        role: "user",
      });
      recipients = users
        .filter((u: any) => u.email)
        .map((u: any) => ({ email: u.email, name: u.display_name || u.full_name || "User" }));
    } else if (recipientType === "active_loans") {
      // "Active users" — only accounts marked active in the app.
      const users = await base44.asServiceRole.entities.User.filter({ role: "user", account_status: "active" });
      recipients = users
        .filter((u: any) => u.email)
        .map((u: any) => ({ email: u.email, name: u.display_name || u.full_name || "User" }));
    } else if (recipientType === "all") {
      // "All users" — every registered user account.
      const users = await base44.asServiceRole.entities.User.filter({ role: "user" });
      recipients = users
        .filter((u: any) => u.email)
        .map((u: any) => ({ email: u.email, name: u.display_name || u.full_name || "User" }));
    } else {
      return Response.json({ error: "Invalid recipientType" }, { status: 400 });
    }

    if (recipients.length === 0) {
      return Response.json({ error: "No recipients found with email addresses" }, { status: 400 });
    }

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");
    const from = fromName
      ? `${fromName} <shubhdhanlakshmifund@gmail.com>`
      : "shubhdhanlakshmifund@gmail.com";

    let sent = 0;
    let failed = 0;
    const failedEmails: string[] = [];

    for (const r of recipients) {
      try {
        const personalizedBody = htmlBody.replace(/\{\{name\}\}/g, r.name);
        const rawMessage = buildRawMessage(r.email, from, subject, personalizedBody);
        const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw: rawMessage }),
        });
        if (sendRes.ok) {
          sent++;
        } else {
          failed++;
          failedEmails.push(r.email);
        }
      } catch (e) {
        failed++;
        failedEmails.push(r.email);
      }
    }

    return Response.json({
      success: true,
      sent,
      failed,
      total: recipients.length,
      failedEmails: failedEmails.slice(0, 10),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}