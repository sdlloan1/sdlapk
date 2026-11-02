const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

// Shared HTML email helpers used by SDL email-sending backend functions.

const LOGO_URL = "https://media.base44.com/images/public/6a65ccde323b932e9e9dc990/42c50083d_applogo.png";

export function logoImg(size = 76) {
  return `<img src="${LOGO_URL}" alt="SDL" width="${size}" height="${size}" style="border-radius:18px; display:block; margin:0 auto 10px auto;" />`;
}

export function emailHeader() {
  return `<tr>
    <td style="background: linear-gradient(135deg, #ff4d2e 0%, #ff8a3d 100%); padding: 28px 32px; text-align:center;">
      ${logoImg(76)}
      <div style="font-size: 30px; font-weight: 800; color:#ffffff; letter-spacing: 1px; margin-bottom: 4px;">SDL</div>
      <div style="font-size: 13px; color:#ffe8dc; font-weight:500; letter-spacing: 0.5px;">India's No. 1 Friendly Loan</div>
    </td>
  </tr>`;
}

export function emailFooter(closingLine) {
  return `<tr>
    <td style="background-color:#2b1810; padding: 24px 32px; text-align:center;">
      ${logoImg(56)}
      <div style="font-size:16px; font-weight:800; color:#ffffff; margin-bottom:4px;">SDL</div>
      <div style="font-size:12px; color:#d8b8a8; margin-bottom:12px;">India's No. 1 Friendly Loan</div>
      <div style="font-size:11px; color:#9a7d70; line-height:1.6;">${closingLine}<br>Warm regards, Team SDL</div>
    </td>
  </tr>`;
}

export function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function buildRawMessage(to, from, subject, htmlBody) {
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