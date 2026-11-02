const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { upiQrUrl, formatINR } from "@/lib/sdlUtils";

const SDL_LOGO = "https://media.base44.com/images/public/6a65ccde323b932e9e9dc990/b4f7eec46_b088026ec_play-store-icon.png";

function loadImage(src, crossOrigin) {
  return new Promise((resolve) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawVerifiedTick(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#22C55E";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - r * 0.45, y);
  ctx.lineTo(x - r * 0.1, y + r * 0.4);
  ctx.lineTo(x + r * 0.5, y - r * 0.35);
  ctx.lineWidth = r * 0.22;
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

// Builds a branded QR image (logo + SDL partner name + verified tick + amount)
// and triggers a download. `count` is how many parts share this amount.
// Falls back to opening the plain QR if rendering fails.
export async function downloadBrandedQr({ upiId, upiName, amount, count = 1 }) {
  const qrUrl = upiQrUrl(upiId, amount, upiName);
  const qrBlob = await fetch(qrUrl).then((r) => r.blob()).catch(() => null);
  if (!qrBlob) { window.open(qrUrl, "_blank"); return; }

  const qrObjUrl = URL.createObjectURL(qrBlob);
  const [qrImg, logoImg] = await Promise.all([loadImage(qrObjUrl), loadImage(SDL_LOGO, true)]);
  URL.revokeObjectURL(qrObjUrl);
  if (!qrImg) { window.open(qrUrl, "_blank"); return; }

  const W = 600, H = 780;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#FF8C42";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, W - 24, H - 24);

  if (logoImg) {
    const ls = 90;
    ctx.drawImage(logoImg, (W - ls) / 2, 40, ls, ls);
  }

  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 26px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Shubh Dhan Lakshmi", W / 2, 160);

  const qrSize = 360;
  const qrX = (W - qrSize) / 2;
  const qrY = 190;
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "#64748B";
  ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Pay to", W / 2, qrY + qrSize + 40);

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 24px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "left";
  const nameWidth = ctx.measureText(upiName).width;
  const tickR = 13;
  const tickGap = 10;
  const groupWidth = nameWidth + tickGap + tickR * 2;
  const groupX = (W - groupWidth) / 2;
  const nameY = qrY + qrSize + 78;
  ctx.fillText(upiName, groupX, nameY);
  drawVerifiedTick(ctx, groupX + nameWidth + tickGap + tickR, nameY - 8, tickR);

  ctx.fillStyle = "#64748B";
  ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Amount", W / 2, nameY + 50);
  ctx.fillStyle = "#FF4B2B";
  ctx.font = "bold 34px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(formatINR(amount), W / 2, nameY + 92);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "500 14px 'Plus Jakarta Sans', sans-serif";
  ctx.fillText(count > 1 ? `Pay this amount ${count} times` : "Pay this amount once", W / 2, nameY + 124);

  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = `SDL_QR_${amount}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objUrl), 2000);
}

// Downloads one branded QR per unique amount simultaneously.
// qrSpecs: [{ amount, count }]
export async function downloadAllBrandedQrs(qrSpecs, payee) {
  await Promise.all(
    qrSpecs.map((spec) =>
      downloadBrandedQr({
        upiId: payee.upiId,
        upiName: payee.upiName,
        amount: spec.amount,
        count: spec.count,
      })
    )
  );
}