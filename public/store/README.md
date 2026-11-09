# Play Store screenshots — SDL customer app

Fourteen ready-to-upload phone screenshots (1080 × 1920 px) of the real customer app, each framed in SDL branding artwork. Screens 11–14 come from the signed-in app, captured with a demo account (KYC approved); its email is blurred on the Profile shot.

Open [`review.html`](../store/review.html) in the running preview (`/store/review.html`) to see all fourteen on one page and download them (a zip of all 14, or one by one).

## Files

| # | File | Headline on image | Suggested Play caption |
|---|------|-------------------|------------------------|
| 1 | `screenshots/01-onboarding-1.png` | Friendly Loans, Simplified | Borrow from people who know you |
| 2 | `screenshots/02-onboarding-2.png` | Why SDL is Beneficial | Fair terms and transparent charges |
| 3 | `screenshots/03-onboarding-3.png` | Built on Trust & Community | Friends helping friends |
| 4 | `screenshots/04-login.png` | Log in in seconds | Secure access to your account |
| 5 | `screenshots/05-register.png` | Create your account | Sign up with your email in a minute |
| 6 | `screenshots/06-verify-email.png` | Verify your email | One-time code keeps you safe |
| 7 | `screenshots/07-terms.png` | Clear terms, no surprises | Read and accept before you start |
| 8 | `screenshots/08-kyc-step1.png` | KYC in 3 quick steps | Tell us a little about yourself |
| 9 | `screenshots/09-kyc-step2.png` | Upload documents safely | PAN, Aadhaar and salary slip |
| 10 | `screenshots/10-kyc-step3.png` | Money on your salary date | Set your UPI and repayment day |
| 11 | `screenshots/11-dashboard.png` | Your loan dashboard | Limit, loans and referrals in one place |
| 12 | `screenshots/12-repayment.png` | Repay on your salary date | Every instalment, its due date and status |
| 13 | `screenshots/13-wallet.png` | Saving Wallet | Put money aside and track your balance |
| 14 | `screenshots/14-profile.png` | Your profile, secured | KYC, bank and contact details in one place |

## Uploading to Play Console

1. Play Console → your app → **Grow → Store presence → Main store listing**.
2. **Phone screenshots**: Play accepts **2–8** images, in the order you upload them. Upload 8 of the fourteen — a good set is 1, 2, 3, 11, 12, 13, 14 and one of 8/9/10, or reorder to taste.
3. Drag them in the table order above; the first two are what shoppers see first.
4. Save, then open the **Store listing preview** to confirm cropping.

### Specs these files already meet

- PNG, **1080 × 1920 px** (9:16 portrait)
- Within Play's limits: 320–3840 px per side, max 8 MB per file
- Real app UI, no device frames from Play's editor needed — the artwork is baked in

Still missing for a full listing: a **feature graphic (1024 × 500)** and the app icon (already in `assets/android-icon.png`).

## How these were produced

1. The customer app was run in a headless browser at a 360 × 640 mobile viewport with a 3× pixel ratio, so every capture is exactly 1080 × 1920.
2. A temporary customer account was created through the app's own signup form (email OTP via a disposable inbox) to reach the verified-user screens; that account's user record was deleted afterwards.
3. Each capture was placed inside the branded frame (gradient background, logo, headline, phone mock) and exported at 1080 × 1920.

Re-shoot after a UI change by repeating those three steps; nothing in the app source affects these files.

## Note on the signed-in screens

Screens 11–14 were captured after signing in with a demo customer account whose KYC is already approved. KYC submissions now go through the `submitKyc` backend function (the borrower's own fields only; status, attempts and limits are set server-side), so a fresh signup can complete KYC and reach the dashboard again.
