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
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error("logo load failed"));
    img.src = url;
  });
}

// ── Embedded font (DejaVu Sans) so the ₹ glyph renders correctly ──────────────
// jsPDF's built-in fonts can't render the Unicode rupee sign — it garbles into
// stray bytes (looks like a small "1"). DejaVu Sans supports ₹, so we embed it.
let FONT_CACHE = undefined; // undefined = not tried; null = failed; {regular, bold} = base64
const FONT_URLS = {
  regular: "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf",
  bold: "https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans-Bold.ttf",
};

async function loadFontBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("font fetch failed");
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function ensureFonts() {
  if (FONT_CACHE !== undefined) return FONT_CACHE;
  try {
    const [regular, bold] = await Promise.all([
      loadFontBase64(FONT_URLS.regular),
      loadFontBase64(FONT_URLS.bold),
    ]);
    FONT_CACHE = { regular, bold };
  } catch (e) {
    FONT_CACHE = null;
  }
  return FONT_CACHE;
}

function ordinal(d) {
  const n = parseInt(d);
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function fmtExecDate(dateObj) {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  return `${ordinal(d.getDate())} day of ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

function getStyle(settings) {
  let override = {};
  try { override = JSON.parse(settings?.agreement_style || "{}"); } catch (e) {}
  return {
    bodySize: Number(override.bodySize) || 9,
    headingSize: Number(override.headingSize) || 11,
    subheadingSize: Number(override.subheadingSize) || 9,
    lineHeight: Number(override.lineHeight) || 4.2,
    margin: Number(override.margin) || 18,
    headerAlign: override.headerAlign || "center",
    bodyAlign: override.bodyAlign || "left",
    primaryColor: override.primaryColor || "#FF4B2B",
    textColor: override.textColor || "#1a1a1a",
    subColor: override.subColor || "#555555",
    importantColor: override.importantColor || "#CC2200",
    paragraphSpacing: Number(override.paragraphSpacing) || 5,
    sectionSpacing: Number(override.sectionSpacing) || 7,
  };
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}

export async function generateAgreementPdf({ user, settings, principal, interest, portalCharge, processingFee, savingsBack, totalCharges, total, dueDate, loanId, requestDate }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const st = getStyle(settings);
  const margin = st.margin;
  const contentW = pageW - margin * 2;
  const [pr, pg, pb] = hexToRgb(st.primaryColor);
  const [tr, tg, tb] = hexToRgb(st.textColor);
  const [sr, sg, sb] = hexToRgb(st.subColor);
  const [ir, ig, ib] = hexToRgb(st.importantColor);

  // Embed DejaVu Sans so ₹ renders. Fall back to helvetica + "Rs." if it fails.
  const fonts = await ensureFonts();
  const fontOk = !!fonts;
  const FAMILY = "DejaVuSans";
  if (fontOk) {
    doc.addFileToVFS(`${FAMILY}-Regular.ttf`, fonts.regular);
    doc.addFont(`${FAMILY}-Regular.ttf`, FAMILY, "normal");
    doc.addFileToVFS(`${FAMILY}-Bold.ttf`, fonts.bold);
    doc.addFont(`${FAMILY}-Bold.ttf`, FAMILY, "bold");
  }
  const baseFont = fontOk ? FAMILY : "helvetica";

  const rupee = (n) => (fontOk ? `₹${Number(n).toLocaleString("en-IN")}` : `Rs. ${Number(n).toLocaleString("en-IN")}`);

  const lenderName = settings?.lender_name || "Subrato Das";
  const lenderPan = settings?.lender_pan || "GTSPD8069M";
  const lenderEmail = settings?.lender_email || "shubhdhanlakshmifund@gmail.com";
  const lenderAddress = settings?.lender_address || "Indian Doorstep, Gali no. 7, Block M, Near sector 59 metro station, Mamura, Sector 59, Gautam Buddha Nagar, Noida, Uttar Pradesh - 201301";

  const borrowerName = (user.display_name || user.full_name || "").toUpperCase();
  const borrowerPan = (user.pan_number || "-").toUpperCase();
  const borrowerEmail = user.email || "-";
  const borrowerAddress = formatAddress(user);

  const interestRate = Number(settings?.interest_rate) || 2;
  const portalRate = Number(settings?.portal_charge_percentage) || 8;
  const processingRate = Number(settings?.processing_fee_percentage) || 9;
  const savingsRate = Number(settings?.savings_percentage) || 1;
  const overdueRate = Number(settings?.overdue_daily_rate) || 1;
  const sigDate = requestDate ? new Date(requestDate) : new Date();
  const execDate = fmtExecDate(sigDate);

  let y = 0;
  let pageNum = 1;

  const setFont = (bold = false) => doc.setFont(baseFont, bold ? "bold" : "normal");

  const checkPageBreak = (needed = 10) => {
    if (y + needed > pageH - 16) {
      doc.addPage();
      pageNum++;
      y = margin;
    }
  };

  const addFooterToAll = () => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      setFont(false);
      doc.setFontSize(6.5);
      doc.setTextColor(180, 180, 180);
      doc.text(`SDL (Shubh Dhan Lakshmi) — Loan Agreement — Page ${p} of ${totalPages}`, pageW / 2, pageH - 8, { align: "center" });
      if (loanId) doc.text(`Loan ID: ${loanId}`, margin, pageH - 8);
    }
  };

  // Mixed-style paragraph writer (bold spans inline). Renders each word once.
  const writeMixed = (segments, align = "left") => {
    const lineW = contentW;
    const sz = st.bodySize;

    // Build a flat word list with style flags.
    const wordList = [];
    segments.forEach(seg => {
      const words = String(seg.text).split(/\s+/).filter(Boolean);
      words.forEach(w => wordList.push({ w, bold: !!seg.bold, italic: !!seg.italic }));
    });

    // Wrap into lines.
    const lines = [];
    let cur = [];
    let curW = 0;
    wordList.forEach(item => {
      setFont(item.bold);
      doc.setFontSize(sz);
      const ww = doc.getTextWidth(item.w + " ");
      if (cur.length && curW + ww > lineW + 0.5) {
        lines.push(cur);
        cur = [item];
        curW = ww;
      } else {
        cur.push(item);
        curW += ww;
      }
    });
    if (cur.length) lines.push(cur);

    lines.forEach((line, li) => {
      checkPageBreak(sz * 0.42 + 2);

      // Measure total line width for center/right alignment.
      let totalW = 0;
      line.forEach(it => {
        setFont(it.bold);
        doc.setFontSize(sz);
        totalW += doc.getTextWidth(it.w + (li < lines.length - 1 ? " " : ""));
      });

      let xCur = margin;
      if (align === "center") xCur = margin + (lineW - totalW) / 2;

      line.forEach((item, wi) => {
        setFont(item.bold);
        doc.setFontSize(sz);
        doc.setTextColor(tr, tg, tb);
        doc.text(item.w, xCur, y);
        xCur += doc.getTextWidth(item.w + (wi < line.length - 1 ? " " : ""));
      });
      if (li < lines.length - 1) y += st.lineHeight;
    });
    y += st.lineHeight;
  };

  const writeLine = (text, { bold = false, size = null, color = null, align = "left", italic = false } = {}) => {
    const sz = size || st.bodySize;
    setFont(bold);
    doc.setFontSize(sz);
    if (italic) doc.setFont(baseFont, bold ? "bolditalic" : "italic");
    if (color) doc.setTextColor(...color);
    else doc.setTextColor(tr, tg, tb);
    checkPageBreak(sz * 0.42 + 2);
    if (align === "center") doc.text(text, pageW / 2, y, { align: "center" });
    else doc.text(text, margin, y);
    y += sz * 0.42 + 1.4;
  };

  const space = (h) => { y += h; };

  // ─── PAGE 1 ──────────────────────────────────────────────────────────────────
  let logoAdded = false;
  try {
    const logoData = await loadImageDataUrl(SDL_LOGO);
    doc.addImage(logoData, "PNG", pageW / 2 - 9, 10, 18, 18);
    logoAdded = true;
  } catch (e) {}

  y = logoAdded ? 32 : 14;

  setFont(true);
  doc.setFontSize(st.headingSize + 2);
  doc.setTextColor(pr, pg, pb);
  doc.text("SHUBH DHAN LAKSHMI", pageW / 2, y, { align: "center" });
  y += 5;

  setFont(false);
  doc.setFontSize(7.5);
  doc.setTextColor(sr, sg, sb);
  doc.text("Friendly Salary-Backed Loan Platform", pageW / 2, y, { align: "center" });
  y += 4;

  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.7);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  setFont(true);
  doc.setFontSize(st.subheadingSize + 1);
  doc.setTextColor(tr, tg, tb);
  doc.text("LOAN AGREEMENT", pageW / 2, y, { align: "center" });
  y += 6;

  doc.setTextColor(tr, tg, tb);
  writeMixed([
    { text: "This is the " },
    { text: "friendly", bold: true },
    { text: " (friend/family) loan agreement (" },
    { text: '"Agreement"', bold: true },
    { text: ") is being entered into this " },
    { text: execDate, bold: true },
    { text: " (" },
    { text: '"Execution Date"', bold: true },
    { text: ")." },
  ], st.bodyAlign);
  space(st.paragraphSpacing);

  writeLine("BETWEEN", { bold: true, size: st.bodySize + 0.5 });
  space(2);

  writeMixed([
    { text: lenderName.toUpperCase(), bold: true },
    { text: ", AM (Account Manager) of " },
    { text: "SDL (Shubh Dhan Lakshmi)", bold: true },
    { text: " whose PAN card number is " },
    { text: lenderPan, bold: true },
    { text: `, Official email ID: ${lenderEmail}, and he residing at ${lenderAddress}. herein after referred to as the "` },
    { text: "Lender", bold: true },
    { text: `" of the ` },
    { text: "FIRST PARTY", bold: true },
    { text: ";" },
  ], st.bodyAlign);
  space(st.paragraphSpacing);

  writeLine("AND", { bold: true, size: st.bodySize + 0.5 });
  space(2);

  writeMixed([
    { text: borrowerName, bold: true },
    { text: `, having PAN number ` },
    { text: borrowerPan, bold: true },
    { text: `, registered email ID: ${borrowerEmail}, Indian citizen residing at ${borrowerAddress}, herein after referred to as the "` },
    { text: "Borrower", bold: true },
    { text: `" of the ` },
    { text: "SECOND PARTY", bold: true },
    { text: `. The Lender and the Borrower are hereinafter individually referred to as "` },
    { text: "Party", bold: true },
    { text: `" and collectively as the "` },
    { text: "Parties", bold: true },
    { text: `".` },
  ], st.bodyAlign);
  space(st.paragraphSpacing);

  writeLine("WHEREAS", { bold: true, size: st.bodySize + 0.5 });
  space(2);

  writeMixed([
    { text: "A. The Borrower is the registered user of the '" },
    { text: "SDL (Shubh Dhan Lakshmi)", bold: true },
    { text: "', managed and owned by Subrato Das and his team. The Lender has agreed to advance the Principal Amount (as defined hereunder) subject to the terms and conditions mentioned in this Agreement." },
  ], st.bodyAlign);
  space(st.paragraphSpacing);

  writeMixed([
    { text: "B. The Parties have now agreed to execute this Agreement recording the provisions, including the covenants and representations of the Borrower, in relation to the debt requirement of the Borrower, which is being funded by the Lender, in terms of this Agreement." },
  ], st.bodyAlign);
  space(st.paragraphSpacing);

  writeMixed([
    { text: "IN CONSIDERATION", bold: true },
    { text: " of the mutual covenants and agreements set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which is acknowledged, the Parties, intending to be legally bound by this Agreement, hereby agree as follows:" },
  ], st.bodyAlign);
  space(st.sectionSpacing);

  checkPageBreak(12);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  writeLine("NOW THIS AGREEMENT WITNESSETH AS BELOW:", { bold: true, align: "center", size: st.bodySize });
  space(3);
  doc.line(margin, y, pageW - margin, y);
  y += st.sectionSpacing;

  writeMixed([
    { text: "SDL (Shubh Dhan Lakshmi)", bold: true },
    { text: " terms and conditions:" },
  ], st.bodyAlign);
  space(3);

  writeMixed([
    { text: `1. If you have taken 'X' Amount then you have to pay 'X' + ` },
    { text: `(${interestRate}%) As Interest`, bold: true },
    { text: `, ` },
    { text: `(${portalRate}%) Portal Charge`, bold: true },
    { text: `, ` },
    { text: `(${processingRate}%) Processing Fee, (${savingsRate}%) Saving wallet`, bold: true },
    { text: ` of 'X' Amount on the ` },
    { text: "salary date (Neither a yearly nor an EMI option.)", bold: true },
    { text: " which will be known as your " },
    { text: "due date", bold: true },
    { text: "." },
  ], st.bodyAlign);
  space(st.paragraphSpacing);

  writeMixed([
    { text: "2. The limit will depend on your " },
    { text: "good transaction", bold: true },
    { text: ", and if you " },
    { text: "refer", bold: true },
    { text: " any friend or family member, every time he or she takes a loan, 1% of the loan amount will be added to your " },
    { text: "savings wallet", bold: true },
    { text: " once he " },
    { text: "makes the repayment", bold: true },
    { text: ". but keep in mind we don't need 10 members from you we need 1 member from you who is trustworthy. If he or she doesn't make the payment, both of you will be responsible." },
  ], st.bodyAlign);
  space(st.paragraphSpacing);

  writeMixed([{ text: "3. ", bold: true }, { text: "Overview", bold: true }], st.bodyAlign);
  space(1);
  writeMixed([
    { text: "SDL is a " },
    { text: "user-centric portal", bold: true },
    { text: " designed to facilitate friendly loans between the " },
    { text: "SDL team", bold: true },
    { text: " and " },
    { text: "individual users", bold: true },
    { text: ". Upon joining and " },
    { text: "consenting to an agreement, users become friends with the SDL team", bold: true },
    { text: ", enabling them to access " },
    { text: "transparent, no-license-required loans under Indian law", bold: true },
    { text: ". The portal prioritizes clarity, privacy, and user convenience, serving as a support system rather than a traditional lending business." },
  ], st.bodyAlign);
  space(st.sectionSpacing);

  // ─── PAGE 2 ──────────────────────────────────────────────────────────────────
  checkPageBreak(40);

  writeMixed([{ text: "4. ", bold: true }, { text: "Objectives and Success Criteria", bold: true }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Objective", bold: true }, { text: ": Provide a " }, { text: "transparent", bold: true }, { text: ", legally compliant platform for friendly loans within India." }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Objective", bold: true }, { text: ": Ensure users have control over repayment timing, privacy, and clear understanding of charges." }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Success Criteria", bold: true }, { text: ": High user consent rates on agreements before loan disbursement." }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Success Criteria", bold: true }, { text: ": Minimal disputes or complaints related to " }, { text: "hidden fees or privacy breaches", bold: true }, { text: "." }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Success Criteria", bold: true }, { text: ": User engagement with features such as salary-date repayment scheduling and savings wallet accumulation." }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Success Criteria: Effective, non-intrusive legal recourse processes for unresolved repayments." }], st.bodyAlign);
  space(st.paragraphSpacing);

  writeMixed([{ text: "5. ", bold: true }, { text: "Key Features and Requirements", bold: true }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "User Onboarding and Consent: New users can " }, { text: "accept", bold: true }, { text: " an agreement to become " }, { text: "friends with the SDL team", bold: true }, { text: ", enabling loan access with explicit consent on " }, { text: "terms and conditions", bold: true }, { text: "." }], st.bodyAlign);
  space(2);
  writeMixed([{ text: `Friendly Loan Access: Users can obtain loans from the SDL team without a license requirement, emphasizing the "` }, { text: "friendly loan", bold: true }, { text: `" nature under ` }, { text: "Indian law", bold: true }, { text: "." }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Transparent Charges: - " }, { text: `(${interestRate}%) As Interest`, bold: true }, { text: ", " }, { text: `(${portalRate}%) Portal Charge`, bold: true }, { text: ", " }, { text: `(${processingRate}%) Processing Fee`, bold: true }, { text: " and " }, { text: `(${savingsRate}%) deduction from loan amount`, bold: true }, { text: " on repayment, " }, { text: "credited to user's savings wallet.", bold: true }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Savings Wallet Feature", bold: true }, { text: `: A mechanism to accumulate ${savingsRate}% of the loan amount deducted at repayment for future withdrawal by the user, encouraging fund growth.` }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Repayment Flexibility: Users can select their " }, { text: "salary date", bold: true }, { text: " for repayment, ensuring alignment with their cash flow and reducing repayment stress." }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Late Repayment Terms: " }, { text: "No penalty fees", bold: true }, { text: "; instead, interest at " }, { text: `${overdueRate}% per day`, bold: true }, { text: " charged only after user consents to this clause in the agreement." }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Privacy Assurance: Strict protocols to maintain " }, { text: "user data confidentiality throughout the loan process.", bold: true }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Legal Recourse Framework: Clear steps for addressing non-repayment, including:" }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "Formal Legal Notice (15-30 days to repay)", bold: true }], st.bodyAlign);
  space(1);
  writeMixed([{ text: "Civil Recovery Suit options (Summary Suit under Order 37 CPC or Ordinary Money Suit under Indian Contract Act) Police Complaint for Fraud or Cheating under relevant sections of Bharatiya Nyaya Sanhita (BNS) All legal actions are designed to be fair and non-harassing with adequate time given to borrowers." }], st.bodyAlign);
  space(st.paragraphSpacing);

  writeMixed([{ text: "6. ", bold: true }, { text: "Constraints and Assumptions", bold: true }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "The portal operates strictly as a facilitation platform, not as a " }, { text: "formal lending company or business model", bold: true }, { text: ". Loans are granted based on " }, { text: "mutual consent", bold: true }, { text: " and " }, { text: "friendship status", bold: true }, { text: " within the " }, { text: "portal", bold: true }, { text: "." }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "All interest, fees, and penalties apply only after explicit " }, { text: "user agreement", bold: true }, { text: ". Legal actions are contingent upon documented evidence and user agreement terms. The model assumes users are primarily based in India and subject to Indian legal frameworks." }], st.bodyAlign);
  space(st.paragraphSpacing);

  writeMixed([{ text: "7. ", bold: true }, { text: "Dependencies and Stakeholders", bold: true }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "SDL Team: Core group managing loan offerings and user relations. Users: Individuals seeking friendly loans " }, { text: "under agreed terms", bold: true }, { text: ". Legal Advisors: Support drafting agreements and managing legal notices and suits. Technology Team: Responsible for portal development, privacy controls, and feature implementation. Compliance and Privacy Experts: Ensure adherence to data protection laws and transparent communication." }], st.bodyAlign);
  space(st.sectionSpacing);

  // ─── PAGE 3 ──────────────────────────────────────────────────────────────────
  checkPageBreak(30);

  writeMixed([{ text: "8. ", bold: true }, { text: "Conclusion", bold: true }], st.bodyAlign);
  space(2);
  writeMixed([{ text: "SDL Portal offers a unique, legally platform for friendly loans with full transparency and user empowerment. By combining " }, { text: "flexible repayment options", bold: true }, { text: ", " }, { text: "clear fee structures", bold: true }, { text: ", and " }, { text: "respectful legal protocols", bold: true }, { text: ", it " }, { text: "supports", bold: true }, { text: " individuals needing " }, { text: "short-term financial assistance", bold: true }, { text: " without the " }, { text: "complications of formal lending", bold: true }, { text: ". Next steps include finalizing feature development, user testing for consent clarity, and launching with robust privacy and legal support systems in place." }], st.bodyAlign);
  space(st.sectionSpacing + 4);

  // ─── Transaction Details Schedule (table) ────────────────────────────────────
  checkPageBreak(80);
  setFont(true);
  doc.setFontSize(st.bodySize + 1);
  doc.setTextColor(tr, tg, tb);
  doc.text("TRANSACTION DETAILS SCHEDULE", pageW / 2, y, { align: "center" });
  y += 6;

  writeMixed([
    { text: `This transaction details schedule ("` },
    { text: "TD Schedule", bold: true },
    { text: `") is an integral part of the Agreement. Which is decided by the ` },
    { text: "lender", bold: true },
    { text: " and the " },
    { text: "borrower", bold: true },
    { text: "." },
  ], st.bodyAlign);
  space(st.paragraphSpacing);

  checkPageBreak(75);
  const tableX = margin;
  const tableW = contentW;
  const col1W = tableW * 0.62;
  const col2W = tableW * 0.38;
  const headerH = 8;
  const rowH = 6.5;

  const savings = savingsBack || Math.round((principal * savingsRate) / 100);
  const tableRows = [
    ["Principal Amount", rupee(principal)],
    [`Interest (${interestRate}%)`, rupee(interest)],
    [`Portal Charge (${portalRate}%)`, rupee(portalCharge || 0)],
    [`Processing Fee (${processingRate}%)`, rupee(processingFee || 0)],
    [`Saving wallet (${savingsRate}%) Will added after repayment`, rupee(savings)],
    ["Total Charges", rupee(totalCharges || 0)],
    ["Total Repayment", rupee(total)],
    ["Repayment Due Date", formatDate(dueDate)],
    ["Late Payment Charge", `${overdueRate}% per day`],
    ["Repayment Method", "UPI to Lender's verified UPI ID"],
  ];
  const tableH = headerH + tableRows.length * rowH;

  // Header
  doc.setFillColor(pr, pg, pb);
  doc.roundedRect(tableX, y, tableW, headerH, 2, 2, "F");
  setFont(true);
  doc.setFontSize(st.bodySize + 0.5);
  doc.setTextColor(255, 255, 255);
  doc.text("TRANSACTION DETAILS SCHEDULE", tableX + tableW / 2, y + 5.2, { align: "center" });
  y += headerH;

  // Rows
  tableRows.forEach((row, i) => {
    const ry = y;
    const fillEven = i % 2 === 0;
    doc.setFillColor(fillEven ? 255 : 250, fillEven ? 255 : 250, fillEven ? 255 : 250);
    doc.rect(tableX, ry, tableW, rowH, "F");

    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.15);
    if (i > 0) doc.line(tableX, ry, tableX + tableW, ry);
    doc.line(tableX + col1W, ry, tableX + col1W, ry + rowH);

    // Label (left aligned)
    setFont(false);
    doc.setFontSize(st.bodySize - 0.5);
    doc.setTextColor(tr, tg, tb);
    const label = doc.splitTextToSize(row[0], col1W - 4);
    doc.text(label, tableX + 3, ry + 4);

    // Value — left aligned, bold, with ₹ sign
    setFont(true);
    doc.setFontSize(st.bodySize - 0.5);
    doc.setTextColor(tr, tg, tb);
    doc.text(row[1], tableX + col1W + 3, ry + 4, { align: "left" });

    y += rowH;
  });

  // Outer border
  doc.setDrawColor(pr, pg, pb);
  doc.setLineWidth(0.5);
  doc.roundedRect(tableX, y - tableH, tableW, tableH, 2, 2, "S");
  y += st.sectionSpacing;

  // ─── Important ────────────────────────────────────────────────────────────────
  checkPageBreak(35);
  setFont(true);
  doc.setFontSize(st.bodySize);
  doc.setTextColor(ir, ig, ib);
  doc.text("Important:", margin, y);
  y += 5;
  setFont(false);
  doc.setTextColor(tr, tg, tb);

  const importants = [
    [{ text: "1. A " }, { text: "Clickwrap Agreement", bold: true }, { text: " requires " }, { text: "borrower", bold: true }, { text: " to click a button or check a box to agree to terms before proceeding. It is the most legally enforceable style of online contract." }],
    [{ text: "2. The agreement between the two parties will be " }, { text: "successfully", bold: true }, { text: " concluded only After accepting the terms and conditions and submitting the request." }],
    [{ text: "3. An " }, { text: "SDL team member", bold: true }, { text: " can accept, reject, or place on hold the KYC or any request of any borrower, or accept or reject any loan amount request." }],
    [{ text: "4. SDL Management and the SDL team will decide the loan amount for each borrower and whether their limit should be increased or decreased." }],
  ];
  importants.forEach(segs => {
    writeMixed(segs, st.bodyAlign);
    space(2);
  });
  space(st.sectionSpacing);

  // ─── Acknowledgement & Digital Signature ─────────────────────────────────────
  checkPageBreak(32);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  setFont(true);
  doc.setFontSize(st.bodySize);
  doc.setTextColor(tr, tg, tb);
  doc.text("ACKNOWLEDGEMENT & DIGITAL SIGNATURE", margin, y);
  y += 4.5;

  setFont(false);
  doc.setFontSize(st.bodySize - 1);
  doc.setTextColor(sr, sg, sb);
  const ackLines = doc.splitTextToSize("Both parties have digitally signed this agreement by accepting the acknowledgement of the terms and conditions set forth herein. The Borrower acknowledges receipt of the loan amount and agrees to repay as per the schedule above.", contentW);
  ackLines.forEach(l => { checkPageBreak(4); doc.text(l, margin, y); y += 3.8; });
  y += 5;

  // Signature lines
  doc.setDrawColor(130, 130, 130);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 72, y);
  doc.line(pageW - margin - 72, y, pageW - margin, y);
  y += 4;

  // Tick mark (✓) next to each "Sign Digitally" label
  const drawTick = (cx) => {
    doc.setTextColor(34, 197, 94);
    if (fontOk) {
      setFont(true);
      doc.setFontSize(st.bodySize + 2);
      doc.text("\u2713", cx, y);
    } else {
      // Vector checkmark: short down-stroke then long up-stroke
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.8);
      doc.line(cx, y - 0.5, cx + 1.8, y + 1.6);
      doc.line(cx + 1.8, y + 1.6, cx + 5.5, y - 3.4);
      doc.setLineWidth(0.3);
    }
    doc.setTextColor(tr, tg, tb);
  };
  const tickGap = 6;
  drawTick(margin + tickGap);
  drawTick(pageW - margin - 72 + tickGap);

  setFont(true);
  doc.setFontSize(st.bodySize - 1);
  doc.setTextColor(tr, tg, tb);
  doc.text("Lender (Signed digitally)", margin + tickGap + 6, y);
  doc.text("Borrower (Signed digitally)", pageW - margin - 72 + tickGap + 6, y);
  y += 4;
  setFont(false);
  doc.setFontSize(7);
  doc.setTextColor(sr, sg, sb);
  doc.text(`Date: ${formatDate(sigDate)}`, margin, y);
  doc.text(`Date: ${formatDate(sigDate)}`, pageW - margin - 72, y);

  // Footers on every page
  addFooterToAll();

  return doc;
}