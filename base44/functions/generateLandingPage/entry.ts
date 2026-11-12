import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const LOGIN_URL = "https://shubhdhanlakshmi-beta-version.base44.app/login";
const REGISTER_URL = "https://shubhdhanlakshmi-beta-version.base44.app/register";
const CANONICAL_URL = "https://shubhdhanlakshmi.com";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function textToHtml(str) {
  if (!str) return "";
  return escapeHtml(str).replace(/\n/g, "<br>");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const settingsList = await base44.asServiceRole.entities.AppSettings.list();
    const s = settingsList[0] || {};

    const termsHtml = textToHtml(s.terms_conditions) || defaultTerms();
    const privacyHtml = textToHtml(s.privacy_policy) || defaultPrivacy();
    const aboutHtml = textToHtml(s.about_us) || defaultAbout();
    const lenderName = escapeHtml(s.lender_name || "Subrato Das");
    const lenderEmail = escapeHtml(s.lender_email || "shubhdhanlakshmifund@gmail.com");
    const lenderAddress = textToHtml(s.lender_address) || "Indian Doorstep, Gali no. 7, Block M, Near sector 59 metro station, Mamura, Sector 59, Gautam Buddha Nagar, Noida, Uttar Pradesh - 201301";
    const interestRate = s.interest_rate ?? 2;
    const portalCharge = s.portal_charge_percentage ?? 8;
    const processingFee = s.processing_fee_percentage ?? 9;
    const savingsPct = s.savings_percentage ?? 1;
    const referralPct = s.referral_percentage ?? 1;

    const html = buildHtml({
      termsHtml, privacyHtml, aboutHtml,
      lenderName, lenderEmail, lenderAddress,
      interestRate, portalCharge, processingFee, savingsPct, referralPct,
    });

    return Response.json({
      html,
      filename: "sdl-landing-page.html",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function defaultTerms() {
  return `By using the SDL (Shubh Dhan Lakshmi) platform, you agree to the following terms and conditions:<br><br>
 1. <strong>Loan Eligibility:</strong> You must be a salaried individual with a valid UPI ID and completed KYC verification.<br><br>
 2. <strong>Loan Amount:</strong> Loan amounts are determined based on your salary profile and repayment history, subject to admin approval.<br><br>
 3. <strong>Repayment:</strong> The full repayment amount (principal + charges) is due on your next salary date. Late payments incur a daily overdue charge.<br><br>
 4. <strong>Charges:</strong> Interest, portal charge, and processing fee are disclosed upfront before loan disbursement.<br><br>
 5. <strong>Savings:</strong> A percentage of your loan amount is credited back to your SDL wallet upon timely repayment.<br><br>
 6. <strong>Referrals:</strong> Referral earnings are credited only after the referred user's loan is repaid.<br><br>
 7. <strong>KYC:</strong> Providing accurate personal and identity information is mandatory. False information may result in loan rejection and account suspension.<br><br>
 8. <strong>Account Suspension:</strong> SDL reserves the right to suspend accounts for fraudulent activity, repeated defaults, or policy violations.`;
}

function defaultPrivacy() {
  return `SDL (Shubh Dhan Lakshmi) is committed to protecting your personal information:<br><br>
 1. <strong>Data Collection:</strong> We collect your name, mobile number, PAN, address, UPI ID, and salary information for loan processing and KYC verification.<br><br>
 2. <strong>Data Usage:</strong> Your data is used solely for loan approval, disbursement, repayment tracking, and communication. We do not sell your data to third parties.<br><br>
 3. <strong>Data Security:</strong> All personal and financial data is encrypted and stored securely. Access is restricted to authorized personnel only.<br><br>
 4. <strong>Communication:</strong> You may receive WhatsApp messages and emails regarding loan status, repayment reminders, and platform updates.<br><br>
 5. <strong>Your Rights:</strong> You may request data deletion or account closure at any time by contacting our support team.<br><br>
 6. <strong>Third-Party Services:</strong> UPI payments are processed through your chosen payment app. We do not store your payment app credentials.`;
}

function defaultAbout() {
  return `SDL (Shubh Dhan Lakshmi) is a friendly loan platform designed for India that allows users to take short-term salary-backed loans and repay them on their next salary date. Our mission is to provide quick, transparent, and hassle-free financial support to salaried individuals, with a focus on trust, speed, and customer satisfaction. With SDL, you get instant UPI disbursement, clear charges upfront, and a rewarding savings and referral program.`;
}

function buildHtml(opts) {
  const { termsHtml, privacyHtml, aboutHtml, lenderName, lenderEmail, lenderAddress,
    interestRate, portalCharge, processingFee, savingsPct, referralPct } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">

<!-- Primary Meta Tags -->
<title>SDL — Shubh Dhan Lakshmi | Instant Salary-Backed Loans up to &#8377;20,000</title>
<meta name="title" content="SDL — Shubh Dhan Lakshmi | Instant Salary-Backed Loans up to &#8377;20,000">
<meta name="description" content="SDL (Shubh Dhan Lakshmi) — Get instant salary-backed loans up to &#8377;20,000 with UPI disbursement. Apply in minutes, repay on your next salary date. No hidden charges.">
<meta name="keywords" content="salary loan, instant loan, UPI loan, short term loan, salary advance, SDL, Shubh Dhan Lakshmi, quick loan India, personal loan, salaried loan">
<meta name="author" content="SDL (Shubh Dhan Lakshmi)">
<meta name="robots" content="index, follow">
<meta name="googlebot" content="index, follow">
<link rel="canonical" href="${CANONICAL_URL}/">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${CANONICAL_URL}/">
<meta property="og:title" content="SDL — Shubh Dhan Lakshmi | Instant Salary-Backed Loans">
<meta property="og:description" content="Get instant salary-backed loans up to &#8377;20,000 with UPI disbursement. Apply in minutes, repay on your next salary date.">
<meta property="og:site_name" content="SDL — Shubh Dhan Lakshmi">
<meta property="og:locale" content="en_IN">
<meta property="og:image" content="logo.png">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="${CANONICAL_URL}/">
<meta name="twitter:title" content="SDL — Shubh Dhan Lakshmi | Instant Salary-Backed Loans">
<meta name="twitter:description" content="Get instant salary-backed loans up to &#8377;20,000 with UPI disbursement. Apply in minutes, repay on your next salary date.">
<meta name="twitter:image" content="logo.png">

<!-- Mobile / PWA -->
<meta name="theme-color" content="#FF4B2B">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="SDL">
<meta name="mobile-web-app-capable" content="yes">
<meta name="application-name" content="SDL — Shubh Dhan Lakshmi">
<meta name="format-detection" content="telephone=yes">

<!-- Favicon & Logo (replace logo.png with your own logo file) -->
<link rel="icon" type="image/png" href="logo.png">
<link rel="apple-touch-icon" href="logo.png">
<link rel="shortcut icon" href="logo.png">

<!-- Structured Data for SEO -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FinancialService",
  "name": "SDL — Shubh Dhan Lakshmi",
  "description": "Instant salary-backed loans with UPI disbursement for salaried individuals in India.",
  "url": "${CANONICAL_URL}",
  "logo": "${CANONICAL_URL}/logo.png",
  "image": "${CANONICAL_URL}/logo.png",
  "telephone": "+91-9310601973",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Gali no. 7, Block M, Near sector 59 metro station, Mamura, Sector 59",
    "addressLocality": "Gautam Buddha Nagar, Noida",
    "addressRegion": "Uttar Pradesh",
    "postalCode": "201301",
    "addressCountry": "IN"
  },
  "areaServed": "IN",
  "serviceType": "Salary-Backed Short-Term Loans",
  "provider": {
    "@type": "Organization",
    "name": "SDL — Shubh Dhan Lakshmi",
    "foundingDate": "2025"
  },
  "offers": {
    "@type": "Offer",
    "description": "Salary-backed loans up to &#8377;20,000 with UPI disbursement",
    "priceCurrency": "INR",
    "availability": "https://schema.org/InStock"
  }
}
</script>

<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--red:#FF4B2B;--orange:#FF8C42;--gold:#F5C67E;--dark:#2D1B12;--cream:#FFF8F3;--white:#fff;--shadow:0 20px 60px rgba(255,75,43,.15)}
html{scroll-behavior:smooth}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:var(--cream);color:var(--dark);overflow-x:hidden;line-height:1.6;position:relative;min-height:100vh}
section{padding:80px 20px;position:relative}
.container{max-width:1100px;margin:0 auto}
h1{font-size:clamp(2.2rem,6vw,4rem);font-weight:800;line-height:1.1;letter-spacing:-1px}
h2{font-size:clamp(1.8rem,4vw,2.6rem);font-weight:800;letter-spacing:-.5px;margin-bottom:16px}
h3{font-size:1.2rem;font-weight:700}
p{color:#6B5547}
.gradient-text{background:linear-gradient(135deg,var(--red),var(--orange));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:50px;font-size:1rem;font-weight:700;text-decoration:none;transition:all .3s cubic-bezier(.4,0,.2,1);cursor:pointer;border:none}
.btn-primary{background:linear-gradient(135deg,var(--red),var(--orange));color:#fff;box-shadow:0 10px 30px rgba(255,75,43,.4)}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 15px 40px rgba(255,75,43,.5)}
.btn-outline{background:rgba(255,255,255,.7);backdrop-filter:blur(10px);color:var(--dark);border:2px solid rgba(255,75,43,.2)}
.btn-outline:hover{border-color:var(--orange);transform:translateY(-3px)}

/* Mouse-track orange blur background */
.bg-blur{position:fixed;top:0;left:0;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(255,140,66,.18) 0%,rgba(255,75,43,.08) 40%,transparent 70%);pointer-events:none;z-index:0;transform:translate(-50%,-50%);transition:transform .15s ease-out;filter:blur(40px);will-change:transform}
.bg-blur2{position:fixed;top:0;left:0;width:350px;height:350px;border-radius:50%;background:radial-gradient(circle,rgba(245,198,126,.15) 0%,rgba(255,140,66,.06) 40%,transparent 70%);pointer-events:none;z-index:0;transform:translate(-50%,-50%);transition:transform .25s ease-out;filter:blur(35px);will-change:transform}
body > *:not(.bg-blur):not(.bg-blur2){position:relative;z-index:1}

/* Navigation */
nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:16px 20px;transition:all .3s}
nav.scrolled{background:rgba(255,248,243,.85);backdrop-filter:blur(20px);box-shadow:0 4px 30px rgba(0,0,0,.08);padding:10px 20px}
.nav-inner{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between}
.nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
.nav-logo-img{width:40px;height:40px;border-radius:12px;object-fit:cover;display:none}
.nav-logo-img.has-logo{display:block}
.nav-logo-fallback{display:flex;align-items:center}
.nav-logo-text{font-size:1.3rem;font-weight:800;color:var(--dark)}
.nav-logo-text span{color:var(--orange)}
.nav-links{display:flex;gap:28px;align-items:center}
.nav-links a{color:var(--dark);text-decoration:none;font-weight:600;font-size:.92rem;transition:color .2s;cursor:pointer}
.nav-links a:hover{color:var(--orange)}
.nav-cta{display:flex;gap:10px}
.nav-cta .btn{padding:10px 22px;font-size:.88rem}
.menu-toggle{display:none;background:none;border:none;font-size:1.5rem;cursor:pointer;color:var(--dark);z-index:101}
.menu-toggle.active{color:var(--red)}

/* Mobile slide-in menu */
.mobile-menu{position:fixed;top:0;right:0;width:280px;max-width:80vw;height:100vh;background:#fff;box-shadow:-10px 0 40px rgba(0,0,0,.15);z-index:200;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;padding:80px 28px 28px;overflow-y:auto}
.mobile-menu.open{transform:translateX(0)}
.mobile-menu-overlay{position:fixed;inset:0;background:rgba(45,27,18,.5);backdrop-filter:blur(4px);z-index:199;opacity:0;pointer-events:none;transition:opacity .3s ease}
.mobile-menu-overlay.open{opacity:1;pointer-events:auto}
.mobile-menu a{color:var(--dark);text-decoration:none;font-weight:600;font-size:1.05rem;padding:14px 0;border-bottom:1px solid rgba(255,140,66,.1);transition:color .2s,padding-left .2s;cursor:pointer;display:block}
.mobile-menu a:hover{color:var(--orange);padding-left:8px}
.mobile-menu .mobile-cta{display:flex;flex-direction:column;gap:12px;margin-top:24px}
.mobile-menu .mobile-cta .btn{width:100%;justify-content:center}
.mobile-close{position:absolute;top:20px;right:20px;width:40px;height:40px;border-radius:50%;background:rgba(255,140,66,.1);border:none;font-size:1.4rem;cursor:pointer;color:var(--dark);display:flex;align-items:center;justify-content:center;transition:all .2s}
.mobile-close:hover{background:rgba(255,75,43,.15);color:var(--red);transform:rotate(90deg)}
@media(max-width:768px){.nav-links{display:none}.menu-toggle{display:block}.nav-cta{display:none}}

/* Hero */
.hero{min-height:100vh;display:flex;align-items:center;padding-top:100px;background:radial-gradient(ellipse at top right,rgba(255,140,66,.12),transparent 50%),radial-gradient(ellipse at bottom left,rgba(255,75,43,.08),transparent 50%),var(--cream)}
.hero-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:40px;align-items:center}
@media(max-width:768px){.hero-grid{grid-template-columns:1fr;text-align:center}}
.hero h1{margin-bottom:20px}
.hero-sub{font-size:1.15rem;margin-bottom:32px;max-width:480px}
@media(max-width:768px){.hero-sub{margin:0 auto 32px}}
.hero-cta{display:flex;gap:14px;flex-wrap:wrap}
@media(max-width:768px){.hero-cta{justify-content:center}}
.hero-stats{display:flex;gap:32px;margin-top:40px}
@media(max-width:768px){.hero-stats{justify-content:center}}
.stat{text-align:left}
@media(max-width:768px){.text-center-mobile{text-align:center}}
.stat-num{font-size:1.8rem;font-weight:800}
.stat-label{font-size:.78rem;color:#9B8B7F;font-weight:500}

/* 3D Limit Card with mouse track */
.hero-art{position:relative;height:460px;perspective:1200px;display:flex;align-items:center;justify-content:center}
@media(max-width:768px){.hero-art{height:380px;margin-top:20px}}
.limit-card-wrap{position:relative;width:340px;max-width:90vw;animation:floatCard 5s ease-in-out infinite}
@keyframes floatCard{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
.limit-card{width:100%;aspect-ratio:1.6/1;border-radius:24px;background:linear-gradient(135deg,#FF4B2B 0%,#FF8C42 50%,#F5C67E 100%);box-shadow:0 30px 80px rgba(255,75,43,.4),inset 0 1px 0 rgba(255,255,255,.3);padding:28px;color:#fff;display:flex;flex-direction:column;justify-content:space-between;transform-style:preserve-3d;transition:transform .15s ease-out;position:relative;overflow:hidden;cursor:pointer}
.limit-card::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,255,255,.15) 0%,transparent 50%);pointer-events:none}
.limit-card-shine{position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.25) 50%,transparent 60%);pointer-events:none;transition:opacity .2s}
.limit-card-top{display:flex;justify-content:space-between;align-items:flex-start;position:relative;z-index:2}
.limit-card-chip{width:40px;height:30px;border-radius:6px;background:linear-gradient(135deg,#F5C67E,#FFD700);box-shadow:inset 0 1px 2px rgba(0,0,0,.2)}
.limit-card-label{font-size:.75rem;font-weight:600;opacity:.9;text-transform:uppercase;letter-spacing:1px;position:relative;z-index:2}
.limit-card-amount{font-size:2.8rem;font-weight:800;letter-spacing:-1px;position:relative;z-index:2;line-height:1}
.limit-card-amount span{font-size:1.4rem;vertical-align:top}
.limit-card-sub{font-size:.85rem;opacity:.85;margin-top:6px;position:relative;z-index:2}
.limit-card-bottom{display:flex;justify-content:space-between;align-items:flex-end;position:relative;z-index:2}
.limit-card-brand{font-size:1rem;font-weight:800;letter-spacing:.5px}
.limit-card-badge{background:rgba(255,255,255,.2);backdrop-filter:blur(10px);padding:6px 14px;border-radius:50px;font-size:.72rem;font-weight:600}
.art-orb{position:absolute;border-radius:50%;filter:blur(2px);animation:float 6s ease-in-out infinite;pointer-events:none}
.orb1{width:60px;height:60px;background:var(--gold);top:10%;right:5%;animation-delay:1s;box-shadow:0 10px 30px rgba(245,198,126,.5)}
.orb2{width:40px;height:40px;background:var(--orange);bottom:10%;left:0;animation-delay:2s;box-shadow:0 10px 25px rgba(255,140,66,.4)}
.orb3{width:30px;height:30px;background:var(--red);top:20%;left:10%;animation-delay:.5s;opacity:.7}
.coin{position:absolute;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--orange));display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;color:#fff;box-shadow:0 15px 40px rgba(245,198,126,.4);animation:floatCoin 5s ease-in-out infinite;pointer-events:none}
.coin1{top:5%;left:0;animation-delay:0s}
.coin2{bottom:5%;right:0;width:45px;height:45px;font-size:1.2rem;animation-delay:1.5s}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-25px)}}
@keyframes floatCoin{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-20px) rotate(10deg)}}

/* Section headers */
.sec-header{text-align:center;margin-bottom:50px}
.sec-header p{max-width:560px;margin:0 auto}

/* Features */
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.feature-card{background:#fff;border-radius:24px;padding:36px 28px;box-shadow:0 10px 40px rgba(45,27,18,.06);transition:all .4s cubic-bezier(.4,0,.2,1);transform-style:preserve-3d;cursor:pointer;border:1px solid rgba(255,140,66,.08)}
.feature-card:hover{transform:translateY(-8px) rotateX(2deg);box-shadow:0 25px 60px rgba(255,75,43,.15);border-color:rgba(255,140,66,.3)}
.feature-icon{width:64px;height:64px;border-radius:18px;background:linear-gradient(135deg,var(--red),var(--orange));display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 10px 25px rgba(255,75,43,.25)}
.feature-icon svg{width:30px;height:30px;fill:#fff}
.feature-card h3{margin-bottom:10px;font-size:1.15rem}
.feature-card p{font-size:.92rem;line-height:1.5}

/* How it works */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;position:relative}
@media(max-width:768px){.steps{grid-template-columns:1fr}}
.step{text-align:center;position:relative}
.step-num{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--red),var(--orange));color:#fff;font-size:1.4rem;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;box-shadow:0 10px 25px rgba(255,75,43,.3);position:relative;z-index:2}
.step h3{margin-bottom:10px}
.step p{font-size:.9rem;max-width:240px;margin:0 auto}
.steps-line{position:absolute;top:28px;left:16%;right:16%;height:3px;background:linear-gradient(90deg,transparent,var(--orange),var(--orange),transparent);z-index:1}
@media(max-width:768px){.steps-line{display:none}}

/* About */
.about{background:linear-gradient(135deg,#2D1B12,#3D2818);color:#fff;border-radius:32px;padding:60px 40px;overflow:hidden;position:relative}
.about::before{content:'';position:absolute;top:-50%;right:-20%;width:400px;height:400px;background:radial-gradient(circle,rgba(255,140,66,.2),transparent 70%);border-radius:50%}
.about h2{color:#fff;position:relative}
.about p{color:rgba(255,255,255,.8);font-size:1.05rem;position:relative;max-width:680px;margin-top:16px}
.about-stats{display:flex;gap:40px;margin-top:36px;flex-wrap:wrap;position:relative}
.about-stat-num{font-size:2rem;font-weight:800;background:linear-gradient(135deg,var(--gold),var(--orange));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.about-stat-label{font-size:.85rem;color:rgba(255,255,255,.6)}

/* FAQ */
.faq-list{max-width:760px;margin:0 auto}
.faq-item{background:#fff;border-radius:16px;margin-bottom:14px;overflow:hidden;box-shadow:0 4px 20px rgba(45,27,18,.04);transition:box-shadow .3s}
.faq-item.open{box-shadow:0 8px 30px rgba(255,75,43,.12)}
.faq-q{padding:22px 26px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-weight:700;font-size:1rem;color:var(--dark);transition:color .2s}
.faq-q:hover{color:var(--orange)}
.faq-icon{width:28px;height:28px;border-radius:50%;background:rgba(255,140,66,.12);display:flex;align-items:center;justify-content:center;transition:all .3s;flex-shrink:0;margin-left:12px}
.faq-item.open .faq-icon{background:linear-gradient(135deg,var(--red),var(--orange));color:#fff;transform:rotate(45deg)}
.faq-icon span{font-size:1.2rem;line-height:1}
.faq-a{max-height:0;overflow:hidden;transition:max-height .4s ease,padding .4s ease}
.faq-item.open .faq-a{max-height:400px;padding:0 26px 22px}
.faq-a p{font-size:.92rem;color:#6B5547}

/* Legal links section */
.legal-links{text-align:center}
.legal-links-wrap{display:inline-flex;gap:16px;flex-wrap:wrap;justify-content:center}
.legal-link{display:inline-flex;align-items:center;gap:8px;background:#fff;border:2px solid rgba(255,140,66,.15);border-radius:50px;padding:14px 32px;font-size:1rem;font-weight:700;color:var(--dark);text-decoration:none;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);box-shadow:0 4px 20px rgba(45,27,18,.04)}
.legal-link:hover{border-color:var(--orange);color:var(--orange);transform:translateY(-3px);box-shadow:0 10px 30px rgba(255,75,43,.15)}
.legal-link svg{width:18px;height:18px;fill:currentColor}

/* Legal modal */
.modal-overlay{position:fixed;inset:0;background:rgba(45,27,18,.6);backdrop-filter:blur(8px);z-index:200;display:none;align-items:flex-start;justify-content:center;padding:40px 20px;overflow-y:auto;opacity:0;transition:opacity .3s ease}
.modal-overlay.open{display:flex;opacity:1}
.modal{background:#fff;border-radius:24px;max-width:700px;width:100%;padding:40px;box-shadow:0 30px 80px rgba(0,0,0,.3);transform:translateY(30px);transition:transform .3s cubic-bezier(.34,1.56,.64,1);margin:auto}
.modal-overlay.open .modal{transform:translateY(0)}
.modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid rgba(255,140,66,.2)}
.modal-header h2{margin:0}
.modal-close{width:40px;height:40px;border-radius:50%;background:rgba(255,140,66,.1);border:none;font-size:1.3rem;cursor:pointer;color:var(--dark);transition:all .2s;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.modal-close:hover{background:rgba(255,75,43,.15);color:var(--red);transform:rotate(90deg)}
.modal-content{font-size:.95rem;line-height:1.8;color:#5A4538;max-height:60vh;overflow-y:auto;padding-right:8px}
.modal-content strong{color:var(--dark)}
.modal-content::-webkit-scrollbar{width:6px}
.modal-content::-webkit-scrollbar-thumb{background:rgba(255,140,66,.3);border-radius:10px}

/* Footer */
footer{background:#2D1B12;color:#fff;padding:60px 20px 30px}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;max-width:1100px;margin:0 auto}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr}}
.footer-logo{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.footer-logo-img{width:40px;height:40px;border-radius:12px;object-fit:cover;display:none}
.footer-logo-img.has-logo{display:block}
.footer-logo-fallback{display:flex;align-items:center}
.footer-brand{font-size:1.5rem;font-weight:800;color:#fff}
.footer-brand span{color:var(--orange)}
.footer-col h4{color:#fff;font-size:1rem;margin-bottom:16px;font-weight:700}
.footer-col a{display:block;color:#fff;text-decoration:none;font-size:.88rem;margin-bottom:10px;transition:color .2s,padding-left .2s;cursor:pointer}
.footer-col a:hover{color:var(--orange);padding-left:4px}
.footer-desc{color:#fff;font-size:.88rem;max-width:300px;opacity:.85}
.footer-bottom{text-align:center;padding-top:30px;margin-top:40px;border-top:1px solid rgba(255,255,255,.15);font-size:.82rem;max-width:1100px;margin-left:auto;margin-right:auto;color:#fff}

/* Scroll animations */
.reveal{opacity:0;transform:translateY(40px);transition:opacity .7s ease,transform .7s ease}
.reveal.active{opacity:1;transform:translateY(0)}
.reveal-left{opacity:0;transform:translateX(-50px);transition:opacity .7s ease,transform .7s ease}
.reveal-left.active{opacity:1;transform:translateX(0)}
.reveal-right{opacity:0;transform:translateX(50px);transition:opacity .7s ease,transform .7s ease}
.reveal-right.active{opacity:1;transform:translateX(0)}
.reveal-scale{opacity:0;transform:scale(.9);transition:opacity .7s ease,transform .7s ease}
.reveal-scale.active{opacity:1;transform:scale(1)}

/* 3D tilt on touch */
.tilt-card{transition:transform .2s ease-out;transform-style:preserve-3d}

/* Trending animations */
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
.shimmer-text{background:linear-gradient(90deg,var(--red),var(--orange),var(--gold),var(--orange),var(--red));background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 4s linear infinite}

@keyframes glowPulse{0%,100%{box-shadow:0 30px 80px rgba(255,75,43,.4),inset 0 1px 0 rgba(255,255,255,.3)}50%{box-shadow:0 30px 100px rgba(255,75,43,.55),inset 0 1px 0 rgba(255,255,255,.3)}}
.limit-card{animation:floatCard 5s ease-in-out infinite,glowPulse 3s ease-in-out infinite}

@keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.gradient-border{position:relative;background:#fff;border-radius:24px;overflow:hidden}
.gradient-border::before{content:'';position:absolute;inset:0;padding:2px;background:linear-gradient(135deg,var(--red),var(--orange),var(--gold),var(--orange));background-size:300% 300%;animation:gradientShift 4s ease infinite;border-radius:24px;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .3s}
.feature-card:hover .gradient-border::before{opacity:1}

@keyframes bounceIn{0%{opacity:0;transform:scale(.3) translateY(40px)}60%{opacity:1;transform:scale(1.05) translateY(-5px)}100%{opacity:1;transform:scale(1) translateY(0)}}
.bounce-in{animation:bounceIn .7s cubic-bezier(.34,1.56,.64,1)}

@keyframes slideUpFade{0%{opacity:0;transform:translateY(30px)}100%{opacity:1;transform:translateY(0)}}

/* Scroll progress bar */
.scroll-progress{position:fixed;top:0;left:0;height:3px;background:linear-gradient(90deg,var(--red),var(--orange),var(--gold));z-index:150;width:0;transition:width .1s ease;box-shadow:0 0 10px rgba(255,75,43,.5)}

/* Floating action pulse */
@keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(255,75,43,.4)}70%{box-shadow:0 0 0 20px rgba(255,75,43,0)}100%{box-shadow:0 0 0 0 rgba(255,75,43,0)}}
.pulse-btn{animation:pulseRing 2s infinite}

/* Counter glow */
@keyframes countGlow{0%,100%{text-shadow:0 0 0 rgba(255,75,43,0)}50%{text-shadow:0 0 20px rgba(255,140,66,.4)}}
.stat-num{animation:countGlow 3s ease-in-out infinite}

/* Marquee for trust badges */
@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.trust-marquee{overflow:hidden;white-space:nowrap;padding:20px 0;background:rgba(255,140,66,.04);border-radius:16px}
.trust-marquee-inner{display:inline-flex;gap:40px;animation:marquee 20s linear infinite}
.trust-badge{display:inline-flex;align-items:center;gap:8px;font-size:.9rem;font-weight:600;color:var(--dark);opacity:.7}
.trust-badge svg{width:18px;height:18px;fill:var(--orange)}

/* Magnetic hover for buttons */
.btn-magnetic{transition:transform .2s cubic-bezier(.4,0,.2,1)}

/* Section divider wave */
.wave-divider{height:60px;width:100%;overflow:hidden;line-height:0}
.wave-divider svg{width:100%;height:100%;display:block}
</style>
</head>
<body>

<!-- Mouse-track orange blur background -->
<div class="bg-blur" id="bgBlur"></div>
<div class="bg-blur2" id="bgBlur2"></div>
<!-- Scroll progress bar -->
<div class="scroll-progress" id="scrollProgress"></div>

<!-- Navigation -->
<nav id="nav">
  <div class="nav-inner">
    <a href="#hero" class="nav-logo">
      <img src="logo.png" alt="SDL Logo" class="nav-logo-img" id="navLogoImg" onerror="this.classList.remove('has-logo'); this.style.display='none'">
      <span class="nav-logo-fallback" id="navLogoFallback">
        <svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="navg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FF4B2B"/><stop offset="100%" stop-color="#FF8C42"/></linearGradient></defs><circle cx="50" cy="50" r="46" fill="url(#navg)"/><path d="M50 22 C40 35 30 40 30 55 C30 68 40 78 50 78 C60 78 70 68 70 55 C70 40 60 35 50 22 Z" fill="#fff" opacity=".9"/><circle cx="50" cy="55" r="8" fill="#FF4B2B"/><text x="50" y="94" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold" font-family="Arial">SDL</text></svg>
      </span>
      <span class="nav-logo-text">Shubh <span>Dhan Lakshmi</span></span>
    </a>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#how">How It Works</a>
      <a href="#about">About</a>
      <a href="#faq">FAQ</a>
      <a onclick="openModal('terms')">Terms</a>
      <a onclick="openModal('privacy')">Privacy</a>
    </div>
    <div class="nav-cta">
      <a href="${LOGIN_URL}" class="btn btn-outline">Login</a>
      <a href="${REGISTER_URL}" class="btn btn-primary">Create Account</a>
    </div>
    <button class="menu-toggle" id="menuToggle" onclick="toggleMenu()">&#9776;</button>
  </div>
</nav>

<!-- Mobile slide-in menu -->
<div class="mobile-menu-overlay" id="mobileOverlay" onclick="closeMobileMenu()"></div>
<div class="mobile-menu" id="mobileMenu">
  <button class="mobile-close" onclick="closeMobileMenu()">&times;</button>
  <a href="#features" onclick="closeMobileMenu()">Features</a>
  <a href="#how" onclick="closeMobileMenu()">How It Works</a>
  <a href="#about" onclick="closeMobileMenu()">About</a>
  <a href="#faq" onclick="closeMobileMenu()">FAQ</a>
  <a onclick="closeMobileMenu();openModal('terms')">Terms</a>
  <a onclick="closeMobileMenu();openModal('privacy')">Privacy</a>
  <div class="mobile-cta">
    <a href="${LOGIN_URL}" class="btn btn-outline">Login</a>
    <a href="${REGISTER_URL}" class="btn btn-primary">Create Account</a>
  </div>
</div>

<!-- Hero -->
<section class="hero" id="hero">
  <div class="container">
    <div class="hero-grid">
      <div class="text-center-mobile">
        <h1 class="reveal">Instant Salary-Backed <span class="shimmer-text">Loans</span> with UPI Disbursement</h1>
        <p class="hero-sub reveal" style="transition-delay:.1s">SDL (Shubh Dhan Lakshmi) gives you quick, transparent loans repaid on your next salary date. No hidden charges, no paperwork delays.</p>
        <div class="hero-cta reveal" style="transition-delay:.2s">
          <a href="${LOGIN_URL}" class="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/></svg>
            Login
          </a>
          <a href="${REGISTER_URL}" class="btn btn-outline">Create Account</a>
        </div>
        <div class="hero-stats reveal" style="transition-delay:.3s">
          <div class="stat"><div class="stat-num gradient-text">24h</div><div class="stat-label">Approval SLA</div></div>
          <div class="stat"><div class="stat-num gradient-text" data-count="100" data-suffix="%">0%</div><div class="stat-label">UPI Instant</div></div>
          <div class="stat"><div class="stat-num gradient-text" data-count="${savingsPct}" data-suffix="%">0%</div><div class="stat-label">Savings Back</div></div>
        </div>
      </div>
      <div class="hero-art reveal-right">
        <div class="art-orb orb1"></div>
        <div class="art-orb orb2"></div>
        <div class="art-orb orb3"></div>
        <div class="coin coin1">&#8377;</div>
        <div class="coin coin2">&#8377;</div>
        <div class="limit-card-wrap" id="limitCardWrap">
          <div class="limit-card" id="limitCard">
            <div class="limit-card-shine" id="cardShine"></div>
            <div class="limit-card-top">
              <div>
                <div class="limit-card-label">Your Loan Limit</div>
              </div>
              <div class="limit-card-chip"></div>
            </div>
            <div>
              <div class="limit-card-amount"><span>&#8377;</span>20,000</div>
              <div class="limit-card-sub">Repay on your next salary date</div>
            </div>
            <div class="limit-card-bottom">
              <div class="limit-card-brand">SDL</div>
              <div class="limit-card-badge">UPI Enabled</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Trust Marquee -->
<div class="trust-marquee reveal">
  <div class="trust-marquee-inner">
    <span class="trust-badge"><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z"/></svg> Bank-Grade Security</span>
    <span class="trust-badge"><svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z"/></svg> 24h Approval</span>
    <span class="trust-badge"><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg> UPI Instant Transfer</span>
    <span class="trust-badge"><svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> Transparent Charges</span>
    <span class="trust-badge"><svg viewBox="0 0 24 24"><path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3z"/></svg> Refer &amp; Earn</span>
    <span class="trust-badge"><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z"/></svg> Bank-Grade Security</span>
    <span class="trust-badge"><svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z"/></svg> 24h Approval</span>
    <span class="trust-badge"><svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg> UPI Instant Transfer</span>
    <span class="trust-badge"><svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> Transparent Charges</span>
    <span class="trust-badge"><svg viewBox="0 0 24 24"><path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3z"/></svg> Refer &amp; Earn</span>
  </div>
</div>

<!-- Features -->
<section id="features">
  <div class="container">
    <div class="sec-header reveal">
      <h2>Why Choose <span class="gradient-text">SDL?</span></h2>
      <p>Built for salaried Indians who need fast, fair, and transparent financial support — with rewards built in.</p>
    </div>
    <div class="features-grid">
      <div class="feature-card reveal tilt-card">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M11.5 2L2 7v2h20V7L11.5 2zM4 10v8H2v2h19v-2h-2v-8h-3v8h-3v-8H9v8H6v-8H4zm17 10H2v2h19v-2z"/></svg></div>
        <h3>Instant UPI Disbursement</h3>
        <p>Approved loans are sent directly to your UPI ID within 24 hours — no bank visits, no waiting.</p>
      </div>
      <div class="feature-card reveal tilt-card" style="transition-delay:.1s">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4zm0 6c1.4 0 2.5 1.1 2.5 2.5S13.4 12 12 12s-2.5-1.1-2.5-2.5S10.6 7 12 7zm0 12c-2.3 0-4.3-1.2-5.5-3 0-1.8 3.7-2.8 5.5-2.8s5.5 1 5.5 2.8c-1.2 1.8-3.2 3-5.5 3z"/></svg></div>
        <h3>Salary-Backed Trust</h3>
        <p>Loan limits grow with your salary profile and repayment history. Build credit with every on-time repayment.</p>
      </div>
      <div class="feature-card reveal tilt-card" style="transition-delay:.2s">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
        <h3>Transparent Charges</h3>
        <p>Interest ${interestRate}%, portal ${portalCharge}%, processing ${processingFee}% — all disclosed upfront. No hidden fees.</p>
      </div>
      <div class="feature-card reveal tilt-card">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.6 2 4.5 4 4.9V13c0 1.7 1.3 3 3 3v4H7v2h10v-2h-3v-4c1.7 0 3-1.3 3-3v-.1c2-.4 4-2.3 4-4.9V7c0-1.1-.9-2-2-2zM5 9V7h2v3.8C5.8 10.4 5 9.3 5 9zm14 0c0 1.3-.8 2.4-2 2.8V7h2v2z"/></svg></div>
        <h3>${savingsPct}% Savings Back</h3>
        <p>Get ${savingsPct}% of your loan amount credited to your SDL wallet on every timely repayment. Save while you borrow.</p>
      </div>
      <div class="feature-card reveal tilt-card" style="transition-delay:.1s">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5c0-2.3-4.7-3.5-7-3.5zm8 0c-.3 0-.6 0-1 .1 1.2.9 1.5 1.8 1.5 2.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z"/></svg></div>
        <h3>Refer &amp; Earn ${referralPct}%</h3>
        <p>Invite friends and earn ${referralPct}% of their loan amount, credited automatically when they repay.</p>
      </div>
      <div class="feature-card reveal tilt-card" style="transition-delay:.2s">
        <div class="feature-icon"><svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-9H9V6c0-1.7 1.3-3 3-3s3 1.3 3 3v2z"/></svg></div>
        <h3>Secure KYC Verification</h3>
        <p>Bank-grade encryption protects your PAN, address, and UPI data. Verified within 24 hours.</p>
      </div>
    </div>
  </div>
</section>

<!-- How It Works -->
<section id="how" style="background:rgba(255,140,66,.04)">
  <div class="container">
    <div class="sec-header reveal">
      <h2>How It <span class="gradient-text">Works</span></h2>
      <p>Three simple steps from application to disbursement.</p>
    </div>
    <div class="steps">
      <div class="steps-line"></div>
      <div class="step reveal">
        <div class="step-num">1</div>
        <h3>Register &amp; Complete KYC</h3>
        <p>Create your account, verify your identity with PAN and address proof. Approval within 24 hours.</p>
      </div>
      <div class="step reveal" style="transition-delay:.15s">
        <div class="step-num">2</div>
        <h3>Request a Loan</h3>
        <p>Choose your amount, see all charges upfront, and submit. Get approved and receive funds via UPI.</p>
      </div>
      <div class="step reveal" style="transition-delay:.3s">
        <div class="step-num">3</div>
        <h3>Repay on Salary Date</h3>
        <p>Repay via UPI on your next salary date. Earn savings back and grow your loan limit for next time.</p>
      </div>
    </div>
  </div>
</section>

<!-- About -->
<section id="about">
  <div class="container">
    <div class="about reveal">
      <h2>About <span class="gradient-text" style="background:linear-gradient(135deg,#F5C67E,#FF8C42);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">SDL</span></h2>
      <p>${aboutHtml}</p>
      <div class="about-stats">
        <div><div class="about-stat-num">24h</div><div class="about-stat-label">Approval Time</div></div>
        <div><div class="about-stat-num">100%</div><div class="about-stat-label">UPI Disbursement</div></div>
        <div><div class="about-stat-num">${savingsPct}%</div><div class="about-stat-label">Savings on Repayment</div></div>
        <div><div class="about-stat-num">${referralPct}%</div><div class="about-stat-label">Referral Earnings</div></div>
      </div>
    </div>
  </div>
</section>

<!-- FAQ -->
<section id="faq" style="background:rgba(255,140,66,.04)">
  <div class="container">
    <div class="sec-header reveal">
      <h2>Frequently Asked <span class="gradient-text">Questions</span></h2>
      <p>Everything you need to know about SDL loans.</p>
    </div>
    <div class="faq-list">
      <div class="faq-item reveal">
        <div class="faq-q" onclick="toggleFaq(this)">What is SDL (Shubh Dhan Lakshmi)?<div class="faq-icon"><span>+</span></div></div>
        <div class="faq-a"><p>SDL is a friendly loan platform for India that provides short-term salary-backed loans. You borrow now and repay on your next salary date via UPI — no long forms, no bank visits.</p></div>
      </div>
      <div class="faq-item reveal" style="transition-delay:.05s">
        <div class="faq-q" onclick="toggleFaq(this)">How much can I borrow?<div class="faq-icon"><span>+</span></div></div>
        <div class="faq-a"><p>Your loan limit depends on your salary profile and repayment history. New users start with a modest limit that grows with each on-time repayment. Admins review and approve each loan within 24 hours.</p></div>
      </div>
      <div class="faq-item reveal" style="transition-delay:.1s">
        <div class="faq-q" onclick="toggleFaq(this)">What charges apply?<div class="faq-icon"><span>+</span></div></div>
        <div class="faq-a"><p>SDL charges are fully transparent: ${interestRate}% interest, ${portalCharge}% portal charge, and ${processingFee}% processing fee. The total repayment amount is shown before you request the loan. On timely repayment, you get ${savingsPct}% back in your wallet.</p></div>
      </div>
      <div class="faq-item reveal" style="transition-delay:.15s">
        <div class="faq-q" onclick="toggleFaq(this)">How do I receive the loan?<div class="faq-icon"><span>+</span></div></div>
        <div class="faq-a"><p>Once approved, the loan amount is transferred directly to your UPI ID within 24 hours. You'll receive a WhatsApp notification and email confirmation with your agreement.</p></div>
      </div>
      <div class="faq-item reveal" style="transition-delay:.2s">
        <div class="faq-q" onclick="toggleFaq(this)">What happens if I'm late?<div class="faq-icon"><span>+</span></div></div>
        <div class="faq-a"><p>A daily overdue charge applies for late payments. We'll send reminders via WhatsApp before your due date. Consistent on-time repayments increase your loan limit for future borrowing.</p></div>
      </div>
      <div class="faq-item reveal" style="transition-delay:.25s">
        <div class="faq-q" onclick="toggleFaq(this)">How does the referral program work?<div class="faq-icon"><span>+</span></div></div>
        <div class="faq-a"><p>Share your referral link with friends. When they register and repay their first loan, you earn ${referralPct}% of their loan amount — credited automatically to your wallet.</p></div>
      </div>
      <div class="faq-item reveal" style="transition-delay:.3s">
        <div class="faq-q" onclick="toggleFaq(this)">Is my data safe?<div class="faq-icon"><span>+</span></div></div>
        <div class="faq-a"><p>Yes. All personal and financial data is encrypted and stored securely. We use your information only for loan processing and KYC verification. We never sell your data to third parties.</p></div>
      </div>
    </div>
  </div>
</section>

<!-- Legal Links -->
<section id="legal" style="padding:60px 20px">
  <div class="container">
    <div class="legal-links reveal">
      <div class="sec-header" style="margin-bottom:30px">
        <h2>Legal <span class="gradient-text">Documents</span></h2>
        <p>Click to read our terms and privacy policy.</p>
      </div>
      <div class="legal-links-wrap">
        <a class="legal-link" onclick="openModal('terms')">
          <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
          Terms &amp; Conditions
        </a>
        <a class="legal-link" onclick="openModal('privacy')">
          <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
          Privacy Policy
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer>
  <div class="footer-grid">
    <div>
      <div class="footer-logo">
        <img src="logo.png" alt="SDL Logo" class="footer-logo-img" id="footerLogoImg" onerror="this.classList.remove('has-logo'); this.style.display='none'">
        <span class="footer-logo-fallback" id="footerLogoFallback">
          <svg width="40" height="40" viewBox="0 0 100 100"><defs><linearGradient id="ftg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FF4B2B"/><stop offset="100%" stop-color="#FF8C42"/></linearGradient></defs><circle cx="50" cy="50" r="46" fill="url(#ftg)"/><path d="M50 22 C40 35 30 40 30 55 C30 68 40 78 50 78 C60 78 70 68 70 55 C70 40 60 35 50 22 Z" fill="#fff" opacity=".9"/><circle cx="50" cy="55" r="8" fill="#FF4B2B"/><text x="50" y="94" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold" font-family="Arial">SDL</text></svg>
        </span>
        <div class="footer-brand">Shubh <span>Dhan Lakshmi</span></div>
      </div>
      <p class="footer-desc">Instant salary-backed loans with UPI disbursement. Built for India's salaried workforce.</p>
    </div>
    <div class="footer-col">
      <h4>Quick Links</h4>
      <a href="#features">Features</a>
      <a href="#how">How It Works</a>
      <a href="#faq">FAQ</a>
      <a href="#about">About Us</a>
    </div>
    <div class="footer-col">
      <h4>Legal</h4>
      <a onclick="openModal('terms')">Terms &amp; Conditions</a>
      <a onclick="openModal('privacy')">Privacy Policy</a>
    </div>
    <div class="footer-col">
      <h4>Get Started</h4>
      <a href="${LOGIN_URL}">Login</a>
      <a href="${REGISTER_URL}">Create Account</a>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; 2026 SDL (Shubh Dhan Lakshmi) All rights reserved.</p>
  </div>
</footer>

<!-- Legal Modal -->
<div class="modal-overlay" id="modalOverlay" onclick="closeModalOnOverlay(event)">
  <div class="modal" onclick="event.stopPropagation()">
    <div class="modal-header">
      <h2 id="modalTitle">Terms &amp; Conditions</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="modal-content" id="modalContent"></div>
  </div>
</div>

<script>
// === Logo detection: if logo.png loads, show it; otherwise show SVG fallback ===
function checkLogo(imgId, fallbackId) {
  var img = document.getElementById(imgId);
  var fb = document.getElementById(fallbackId);
  if (img && img.naturalWidth > 0) {
    img.classList.add('has-logo');
    if (fb) fb.style.display = 'none';
  }
}
window.addEventListener('load', function() {
  ['navLogoImg', 'footerLogoImg'].forEach(function(id) {
    var img = document.getElementById(id);
    if (img) {
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('has-logo');
      } else {
        img.onload = function() { this.classList.add('has-logo'); };
      }
    }
  });
});

// === Nav scroll effect ===
window.addEventListener('scroll', function(){
  var nav = document.getElementById('nav');
  if(window.scrollY > 30) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
});

// === Mobile slide-in menu ===
function toggleMenu(){
  var menu = document.getElementById('mobileMenu');
  var overlay = document.getElementById('mobileOverlay');
  var toggle = document.getElementById('menuToggle');
  menu.classList.add('open');
  overlay.classList.add('open');
  toggle.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMobileMenu(){
  var menu = document.getElementById('mobileMenu');
  var overlay = document.getElementById('mobileOverlay');
  var toggle = document.getElementById('menuToggle');
  menu.classList.remove('open');
  overlay.classList.remove('open');
  toggle.classList.remove('active');
  document.body.style.overflow = '';
}

// === FAQ accordion ===
function toggleFaq(el){
  var item = el.parentElement;
  item.classList.toggle('open');
}

// === Legal modal ===
var termsContent = ${JSON.stringify(termsHtml)};
var privacyContent = ${JSON.stringify(privacyHtml)};

function openModal(type) {
  var overlay = document.getElementById('modalOverlay');
  var title = document.getElementById('modalTitle');
  var content = document.getElementById('modalContent');
  if (type === 'terms') {
    title.textContent = 'Terms & Conditions';
    content.innerHTML = termsContent;
  } else {
    title.textContent = 'Privacy Policy';
    content.innerHTML = privacyContent;
  }
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  var overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

// === Scroll reveal animation ===
var observer = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if(entry.isIntersecting){
      entry.target.classList.add('active');
    }
  });
},{threshold:0.12});
document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(function(el){observer.observe(el)});

// === 3D tilt on feature cards ===
document.querySelectorAll('.tilt-card').forEach(function(card){
  card.addEventListener('mousemove', function(e){
    var rect = card.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var cx = rect.width / 2;
    var cy = rect.height / 2;
    var rx = ((y - cy) / cy) * -6;
    var ry = ((x - cx) / cx) * 6;
    card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-8px)';
  });
  card.addEventListener('mouseleave', function(){
    card.style.transform = '';
  });
  card.addEventListener('touchmove', function(e){
    var t = e.touches[0];
    var rect = card.getBoundingClientRect();
    var x = t.clientX - rect.left;
    var y = t.clientY - rect.top;
    var cx = rect.width / 2;
    var cy = rect.height / 2;
    var rx = ((y - cy) / cy) * -6;
    var ry = ((x - cx) / cx) * 6;
    card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-8px)';
  });
  card.addEventListener('touchend', function(){
    card.style.transform = '';
  });
});

// === 3D mouse-track tilt on limit card ===
(function(){
  var card = document.getElementById('limitCard');
  var wrap = document.getElementById('limitCardWrap');
  var shine = document.getElementById('cardShine');
  if (!card) return;
  function handleMove(clientX, clientY) {
    var rect = card.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var cx = rect.width / 2;
    var cy = rect.height / 2;
    var rx = ((y - cy) / cy) * -12;
    var ry = ((x - cx) / cx) * 14;
    card.style.transform = 'perspective(1000px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale(1.03)';
    if (shine) {
      var px = (x / rect.width) * 100;
      var py = (y / rect.height) * 100;
      shine.style.background = 'radial-gradient(circle at ' + px + '% ' + py + '%, rgba(255,255,255,.3) 0%, transparent 50%)';
    }
  }
  card.addEventListener('mousemove', function(e){ handleMove(e.clientX, e.clientY); });
  card.addEventListener('mouseleave', function(){
    card.style.transform = '';
    if (shine) shine.style.background = '';
  });
  card.addEventListener('touchmove', function(e){
    e.preventDefault();
    var t = e.touches[0];
    handleMove(t.clientX, t.clientY);
  }, {passive: false});
  card.addEventListener('touchend', function(){
    card.style.transform = '';
    if (shine) shine.style.background = '';
  });
})();

// === Mouse / touch track orange blur background ===
(function(){
  var blur1 = document.getElementById('bgBlur');
  var blur2 = document.getElementById('bgBlur2');
  var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  var cx = tx, cy = ty;
  var cx2 = tx, cy2 = ty;
  function animate() {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    cx2 += (tx - cx2) * 0.04;
    cy2 += (ty - cy2) * 0.04;
    if (blur1) blur1.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
    if (blur2) blur2.style.transform = 'translate(' + cx2 + 'px,' + cy2 + 'px) translate(-50%,-50%)';
    requestAnimationFrame(animate);
  }
  document.addEventListener('mousemove', function(e){ tx = e.clientX; ty = e.clientY; });
  document.addEventListener('touchmove', function(e){
    var t = e.touches[0]; if (t) { tx = t.clientX; ty = t.clientY; }
  }, {passive: true});
  animate();
})();

// === Hero parallax on scroll ===
window.addEventListener('scroll', function(){
  var scrolled = window.scrollY;
  var art = document.querySelector('.hero-art');
  if(art && scrolled < 600) art.style.transform = 'translateY(' + (scrolled * 0.15) + 'px)';
  // Scroll progress bar
  var progress = document.getElementById('scrollProgress');
  if (progress) {
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrolled / docHeight) * 100 : 0;
    progress.style.width = pct + '%';
  }
});

// === Animated number counter ===
function animateCounter(el, target, suffix) {
  var start = 0;
  var duration = 1500;
  var startTime = null;
  function step(ts) {
    if (!startTime) startTime = ts;
    var progress = Math.min((ts - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    var val = Math.floor(eased * target);
    el.textContent = suffix ? (val + suffix) : val;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = suffix ? (target + suffix) : target;
  }
  requestAnimationFrame(step);
}

var counterObserver = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if (entry.isIntersecting && !entry.target.dataset.counted) {
      entry.target.dataset.counted = '1';
      var target = entry.target.dataset.count;
      var suffix = entry.target.dataset.suffix || '';
      if (target) animateCounter(entry.target, Number(target), suffix);
    }
  });
}, {threshold:0.5});
document.querySelectorAll('[data-count]').forEach(function(el){counterObserver.observe(el)});

// === Magnetic button effect ===
document.querySelectorAll('.btn-primary, .btn-outline').forEach(function(btn){
  btn.classList.add('btn-magnetic');
  btn.addEventListener('mousemove', function(e){
    var rect = btn.getBoundingClientRect();
    var x = e.clientX - rect.left - rect.width / 2;
    var y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = 'translate(' + (x * 0.15) + 'px,' + (y * 0.15) + 'px) translateY(-3px)';
  });
  btn.addEventListener('mouseleave', function(){
    btn.style.transform = '';
  });
});

// === Stagger reveal for feature cards ===
document.querySelectorAll('.feature-card').forEach(function(card, i){
  card.style.transitionDelay = (i * 0.08) + 's';
});
</script>
</body>
</html>`;
}