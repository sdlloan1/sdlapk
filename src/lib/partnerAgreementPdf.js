import { jsPDF } from "jspdf";
import { SDL_LOGO, formatINR, formatDate, formatAddress } from "@/lib/sdlUtils";

function loadImageDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error("logo load failed"));
    img.src = url;
  });
}

export async function generatePartnerAgreementPdf({ user, settings, amount }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;

  let logoAdded = false;
  try {
    const logoData = await loadImageDataUrl(SDL_LOGO);
    const logoW = 18;
    doc.addImage(logoData, "PNG", pageW / 2 - logoW / 2, 10, logoW, 18);
    logoAdded = true;
  } catch (e) {}

  let y = logoAdded ? 32 : 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 75, 43);
  doc.text("SHUBH DHAN LAKSHMI", pageW / 2, y, { align: "center" });
  y += 4.5;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text("SDL Partner Investment Agreement", pageW / 2, y, { align: "center" });
  y += 5;

  doc.setDrawColor(255, 75, 43);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text("PARTNER INVESTMENT AGREEMENT", pageW / 2, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  const intro = `This Partner Investment Agreement ("Agreement") is made on ${formatDate(new Date())} between the Lender and the SDL Partner named below, whereby the Partner agrees to invest funds to be used for disbursing loans to SDL borrowers.`;
  const introLines = doc.splitTextToSize(intro, contentW);
  doc.text(introLines, margin, y);
  y += introLines.length * 3.8 + 3;

  const colW = (contentW - 6) / 2;
  const colX1 = margin;
  const colX2 = margin + colW + 6;

  const sectionTitle = (title, x) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 75, 43);
    doc.text(title, x, y);
    y += 4;
  };
  const kv = (label, value, x, w) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(label, x, y);
    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "bold");
    const valLines = doc.splitTextToSize(String(value || "-"), w - 30);
    doc.text(valLines, x + 28, y);
    y += Math.max(3.8, valLines.length * 3.5);
  };

  const lenderStartY = y;
  sectionTitle("LENDER", colX1);
  kv("Name", settings?.lender_name || "Subrato Das", colX1, colW);
  kv("PAN", settings?.lender_pan || "-", colX1, colW);
  kv("Email", settings?.lender_email || "shubhdhanlakshmifund@gmail.com", colX1, colW);
  const lenderAddrLines = doc.splitTextToSize(
    String(settings?.lender_address || "Indian Doorstep, Gali no. 7, Block M, Near sector 59 metro station, Mamura, Sector 59, Gautam Buddha Nagar, Noida, Uttar Pradesh - 201301"),
    colW - 30
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Address", colX1, y);
  doc.setTextColor(35, 35, 35);
  doc.setFont("helvetica", "bold");
  doc.text(lenderAddrLines, colX1 + 28, y);
  y += Math.max(3.8, lenderAddrLines.length * 3.5);
  const lenderEndY = y;

  y = lenderStartY;
  sectionTitle("SDL PARTNER", colX2);
  kv("Name", user.display_name || user.full_name || "-", colX2, colW);
  kv("PAN", user.pan_number || "-", colX2, colW);
  kv("Mobile", user.mobile_number || "-", colX2, colW);
  kv("UPI ID", user.upi_id || "-", colX2, colW);
  const borrowerAddrLines = doc.splitTextToSize(formatAddress(user), colW - 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Address", colX2, y);
  doc.setTextColor(35, 35, 35);
  doc.setFont("helvetica", "bold");
  doc.text(borrowerAddrLines, colX2 + 28, y);
  y += Math.max(3.8, borrowerAddrLines.length * 3.5);
  const borrowerEndY = y;

  y = Math.max(lenderEndY, borrowerEndY) + 4;

  // Investment schedule
  const schedX = margin;
  const schedW = contentW;
  const schedHeaderH = 6;
  const schedRows = [
    ["Investment Amount", formatINR(amount)],
    ["Profit Share", "10% of each loan's profit amount"],
    ["Lock-in Period", "6 months from deposit date"],
    ["Minimum Investment", formatINR(5000)],
    ["Maximum Investment", formatINR(100000)],
    ["Overdue Bonus", "0.5% per day on overdue loans"],
    ["Withdrawal", "Profit withdrawable anytime; capital after lock-in"],
  ];
  const rowH = 5;
  const schedH = schedHeaderH + schedRows.length * rowH + 1;

  doc.setFillColor(255, 75, 43);
  doc.rect(schedX, y, schedW, schedHeaderH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("INVESTMENT TERMS SCHEDULE", schedX + 3, y + 4.2);

  doc.setDrawColor(224, 224, 224);
  doc.setLineWidth(0.2);
  schedRows.forEach((r, i) => {
    const ry = y + schedHeaderH + i * rowH;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(r[0], schedX + 3, ry + 3.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(r[1], schedX + schedW - 3, ry + 3.5, { align: "right" });
    if (i > 0) doc.line(schedX, ry, schedX + schedW, ry);
  });

  doc.setDrawColor(255, 75, 43);
  doc.setLineWidth(0.5);
  doc.rect(schedX, y, schedW, schedH);
  doc.setLineWidth(0.2);

  y += schedH + 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 75, 43);
  doc.text("TERMS AND CONDITIONS", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 70);
  const terms = [
    "1. The Partner agrees to invest the amount specified above, which will be used by SDL to disburse loans to borrowers.",
    "2. The Partner shall receive 10% of the profit amount for each loan funded using the Partner's investment.",
    "3. The invested amount remains locked for a period of 6 months from the date of deposit approval.",
    "4. If a borrower's loan becomes overdue, the Partner shall earn an additional 0.5% per day on the overdue loan amount.",
    "5. The Partner can withdraw accumulated profit at any time by submitting a withdrawal request.",
    "6. When a loan is repaid, the funded amount is reflected back in the Partner's dashboard along with the profit earned.",
    "7. This Agreement is governed by the laws of India and subject to the jurisdiction of courts at Noida, UP.",
  ];
  const termsText = terms.join("\n");
  const termsLines = doc.splitTextToSize(termsText, contentW);
  doc.text(termsLines, margin, y);
  y += termsLines.length * 3.5 + 6;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text("ACKNOWLEDGEMENT & DIGITAL SIGNATURE", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  const ackText = "Both parties have digitally signed this agreement by accepting the acknowledgement of the terms and conditions set forth herein. The Partner acknowledges that the investment amount will be used for loan disbursements and agrees to the profit-sharing terms above.";
  const ackLines = doc.splitTextToSize(ackText, contentW);
  doc.text(ackLines, margin, y);
  y += ackLines.length * 3.3 + 6;

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 70, y);
  doc.line(pageW - margin - 70, y, pageW - margin, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text("Lender (Signed digitally)", margin, y + 4);
  doc.text("SDL Partner (Signed digitally)", pageW - margin - 70, y + 4);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text(`Date: ${formatDate(new Date())}`, margin, y);
  doc.text(`Date: ${formatDate(new Date())}`, pageW - margin - 70, y);

  doc.setFontSize(6.5);
  doc.setTextColor(150, 150, 150);
  doc.text("System-generated agreement by SDL (Shubh Dhan Lakshmi).", pageW / 2, 290, { align: "center" });

  return doc;
}