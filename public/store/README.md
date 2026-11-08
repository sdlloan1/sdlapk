# Play Store screenshots — SDL customer app

Ten ready-to-upload phone screenshots (1080 × 1920 px) of the real customer app, each framed in SDL branding artwork.

Open [`review.html`](../store/review.html) in the running preview (`/store/review.html`) to see all ten on one page.

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

## Uploading to Play Console

1. Play Console → your app → **Grow → Store presence → Main store listing**.
2. **Phone screenshots**: Play accepts **2–8** images, in the order you upload them. Upload 8 of the ten — keep 1, 2, 3, 4, 8, 9, 10 and one of 5/6/7, or reorder to taste.
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

## Note on the dashboard screens

Screens after KYC (Home/Loan, Repayment, Wallet, Profile) are **not** in this set. A freshly registered account cannot finish KYC: the backend rejects the client's save with *"You're not allowed to modify the following fields: data.kyc_status, data.registration_complete, data.kyc_attempt_count"*, so the dashboard is unreachable without an already-approved account. Once that is fixed — or with an approved demo login — those screens can be captured the same way and swapped in.
