# KosRent — Railway deployment

React + Node.js + PostgreSQL property marketplace for Gujarat. Google accounts, shared listings, owner edits, administrator review, private in-app messaging, photo uploads, saved favourites, and English-only interface. No payments, commissions, WhatsApp integration, or SMS OTP.

## Deploy from GitHub to Railway

1. In Railway, create a project and add **PostgreSQL**.
2. Add a service using **Deploy from GitHub repo**, select this repository.
3. In the app service, configure `DATABASE_URL` using a Railway reference to the PostgreSQL service's `DATABASE_URL`. Prefer Railway's private database connection.
4. Add these app service variables:
   - `SESSION_SECRET`: generate a random secret with at least 32 characters, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep it private and stable across deploys.
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: from the Google OAuth web application described below.
   - `APP_URL`: the complete HTTPS public app origin, e.g. `https://kosrent.vedtechnologies.co.in`, without a trailing slash.
   - `ADMIN_EMAILS`: comma-separated Google email addresses allowed to review listings. Use your own Google email.
5. Generate a public domain in the app service's Networking settings. Set `APP_URL` to that domain, then redeploy if necessary.
6. Railway uses `npm run build` and `npm start`; `/api/health` checks database connectivity. Tables are created on first startup. Never commit `.env` or credentials.
7. Sign in with your admin account. Review new listings in **Review**. Only approved listings appear to buyers. Edits return to review; after approval, users see updates within 5 seconds. Messages update within 3 seconds.

Railway publishes the website. Publishing a Codex environment does not deploy this app.

## Google login (required)

In Google Cloud Console, create a project, configure the OAuth consent screen (Google Auth Platform), and create an OAuth client with application type **Web application**. Request only openid, email and profile.

Add `https://kosrent.vedtechnologies.co.in` as an **authorised JavaScript origin** (no path or trailing slash), and this exact authorised redirect URI:

```
https://kosrent.vedtechnologies.co.in/auth/google/callback
```

The primary app button uses server-based Google OAuth with PKCE. It requires the redirect URI above and does not load Google's JavaScript sign-in SDK. Cookies and callbacks use the current public domain; older hosting links redirect to it. A successful return signs in the shared Chrome session before the Google window closes, and the installed app checks its session when it regains focus. Google controls the browser UI during authorization. Credential verification endpoints remain available for compatibility with previously loaded app pages.


Copy its client ID and client secret into Railway variables. While the OAuth app is in testing mode, add your Google email and other testers as test users. Configure its audience/publishing status before allowing the public to sign in. No Google password is entered into KosRent.

## VS Code / Windows

Install Node.js 22 or newer and use a PostgreSQL database. Copy `.env.example` to `.env` and fill in your own settings. For local Google login, add `http://localhost:3000/auth/google/callback` as a redirect URI and use `APP_URL=http://localhost:3000`.

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Open http://localhost:3000. `npm run dev` is a frontend-only Vite server and is not the full app. Use build + start for integrated local development.

## Storage and security

Photos are stored as binary data in PostgreSQL, so they survive deploys without a filesystem volume. Limit: five JPEG/PNG/WebP photos, 3 MB each. This is suitable for an initial smaller deployment; monitor database storage and move photos to object storage as usage grows. Configure Railway backups for your database. Session storage is PostgreSQL-backed with a one-year cookie expiry; API reads do not renew the cookie, so an earlier response cannot overwrite a freshly signed-in session. Logout or browser/app data clearing ends the login earlier. HTTPS secure cookies, same-origin mutation checks, rate limits, server-side ownership and conversation-participant checks are enabled. The home feed is visible without login; full details, owner phone numbers, calls, chats and listing creation require Google sign-in. Google authenticates accounts; it does not verify identity or legal ownership. Review does not certify ownership.

Buyers and sellers can report listings and conversations, and block conversations. Admins can remove reported listings. Contact-pattern filters reduce external contact sharing but cannot catch every disguised phone number or image. No attachments in chat.

## Known remaining launch work

- The release currently serves Kosamba only and uses English. Other-city selection and translated user content are not implemented.
- Privacy/terms, account deletion and report/block tools are implemented. The operator still needs to monitor reports and support, and establish production backup/log retention.
- Test the signed Android release on real devices and through its Play test track, including Google sign-in and return to the app. Local synthetic-session tests do not establish that device behaviour.

## Checks

`npm run build` builds the UI. `node --check server/index.js` checks server syntax. `node --test tests/integration.test.js tests/app-login.test.js tests/identity-login.test.js` runs database-backed API and sign-in checks against an isolated test database with a running server; see the test file for required environment variables. Never use production data for tests.

## Rental-only update
KosRent accepts house rentals only, with 1/2/3 BHK, exact address, monthly rent and a non-negative deposit. Area is in sq ft. Approved rentals appear on Home; marking a home rented hides it from new searches. Legacy sale listings are retained but excluded from rental screens. Two entry points support finding a home or listing one for rent. No paid plans or payments are enabled.

KosRent interface language is English only. Language switching is disabled; user-entered listing content is preserved as entered.

## Kosamba-only PWA

KosRent now serves rentals in Kosamba, Surat only. The home screen has two large actions followed by available rentals. Location selectors are removed; the listing form and server require Kosamba/Surat. Existing out-of-town listings remain stored but do not appear on the public feed. Google sign-in settings and your domain stay unchanged.

PWA files are in `public/manifest.webmanifest`, `public/sw.js`, `public/offline.html`, and `public/icons/`. Deploy over HTTPS. On Android Chrome, use the download icon when an installation prompt is available, or the browser's Install app / Add to Home screen menu. On iPhone, use Safari → Share → Add to Home Screen. Installation UI depends on browser/device support. Test on real devices after Railway deployment. The offline screen is available, but current listings, accounts and messages require a connection. The worker does not cache API or OAuth traffic.

The Android Trusted Web Activity project and signed version 1.0.1/code 2 release are prepared. The owner reports Play developer-account setup is complete, but KosRent has not been created inside Console. App creation, signed AAB upload, Play certificate association and the account's testing/review requirements remain external steps; see [play-store/README.md](play-store/README.md).

## Rental form fields

Owner names are trimmed, repeated spaces removed, and words capitalised when saved. Choose one of the seven configured Kosamba localities, enter the exact address, upload up to five photos (3 MB each), choose furnishing, BHK/area, rent and deposit, and provide a mobile number. Optional Google Maps URLs are displayed as non-clickable reference text, not a navigable link. A user can still copy text; this is not an access restriction on the location. Existing listings need locality/furnishing selected when next edited. Authenticated listing responses include phone numbers for tap-to-call.

## Earlier renewal implementation — inactive during free launch

The following describes retained renewal code and records. Payment collection and expiry are disabled in the current release; setting an environment flag alone does not enable them.

A listing gets 30 days on first approval. Edits/reapproval do not reset its original expiry. Existing approved ads receive 30 days from this migration's first startup. Expired ads are excluded from public listings and new conversation creation without deleting owner data or old conversations. My listings displays the expiry and an in-app reminder during the last seven days; there are no email/push reminders yet.

A manually verified renewal adds 30 days from the later of existing expiry and verification time. Price is ₹100 total per listing; there are no automatic debits. Payment requests require current policy acceptance and a 12-digit UPI reference. Only the owner can submit; only an admin can verify. References are unique. Transactional locking prevents the same request being verified twice. Admins must independently confirm actual ₹100 receipt in bank/UPI records. No gateway or banking verification is connected. A screenshot is not sufficient proof.

The current server refuses renewal payment requests regardless of `BILLING_ENABLED`. Introducing paid plans requires a separate implementation, policy/consent review and compliance with the applicable Play billing rules. Do not publish payment instructions or enable collection for this free release. The owner's business address is not published in the website or public billing configuration.

Owners submit the UPI reference in Profile → My listings → Listing renewals. Review → Payment verification shows pending requests. Verify only after confirming receipt, or reject with a visible explanation. An expired home returns to public search only after a verified extension and provided the listing remains approved. Paid renewal never overrides moderation. Handle eligible refunds manually through the original payer's supported payment route and retain the relevant records; no refund API is implemented. Rent and security deposits are not processed by KosRent.

Legal pages draw operator details from environment settings, list policy version, and remain accessible without login. Listing publication/edit and renewal require express consent recorded server-side. These are policy templates tied to current app behaviour, not a guarantee against disputes; have Indian legal/tax advice before collecting public payments. A Play Store package for a paid digital listing service may need Play Billing or an applicable permitted alternative: do not assume this web UPI flow is automatically allowed in a store release.

## Free launch — current mode

KosRent is free until an explicit later code update. Renewal collection is disabled in the server regardless of an old BILLING_ENABLED value. Public listing/chat queries ignore stored expiry dates; approved Kosamba rentals remain visible until rented/removed/moderated. Owner screens and policies no longer advertise fees or expiry reminders. Old expiry dates and payment records are retained for record keeping, but do not authorise future charging. No timed switch to paid mode is scheduled. Reintroduce paid plans only with advance notice, updated terms and fresh consent. Keep BILLING_ENABLED=false in Railway as well.

## Immediate publication

Valid new Kosamba rental listings publish immediately, without administrator approval. Active listing edits stay public. Existing pending Kosamba house rentals are released when the updated server starts. Removed, rejected and rented listings are not restored by this migration or an ordinary owner edit. Reporting and administrator removal remain available. Listings are owner-provided and are not verified by KosRent.

## Installed mobile display

The manifest requests fullscreen, with standalone fallback for compatible browsers. viewport-fit=cover, dynamic viewport sizing and safe-area insets support varied phone dimensions and notches. iOS home-screen metadata is supplied, but system status/navigation bars and display-mode support are controlled by the OS/browser. No guarantee of immersive fullscreen on every mobile platform. After deployment, existing installs may update their manifest asynchronously; reopening or reinstalling may be needed to pick up a new display mode. Browser-simulated checks covered 320/360/390/430-pixel phones, tablet and landscape, admin controls, bottom navigation, full-height form and viewport resizing. Validate actual installed behaviour on Android and iPhone before claiming device-specific results.

## Chat interface and in-app unread counts

Mobile chat uses a conversation list and separate thread with a back button, incoming/outgoing bubbles, date separators and a bottom composer. Desktop uses two panes. Conversation report/block controls and listing reports are available. Messages refresh every 1.5 seconds while a visible thread is open; conversation previews and unread badges refresh every 2 seconds while the app is visible. Sends display immediately after server confirmation. There are no operating-system push notifications or background delivery guarantees.

Read cursors are stored per user/conversation in PostgreSQL, indexed by message sequence. Viewing a thread marks only the fetched message cursor read; other users' counts and newer messages are not cleared. Unread counts appear on each chat and the Chats navigation icon and survive reloads. Tests covered real local PostgreSQL with synthetic sessions; Google login and on-device deployment should still be checked after Railway redeployment.

## Android / Google Play preparation

An Android Trusted Web Activity project is in `android/`, with store listing and release instructions in `play-store/`. Account deletion is available in Profile and at `/delete-account` without installing the app. It deletes the active account and associated records and revokes all its sessions. Chat users can report or block a participant; a block prevents new conversations across listings by that user. Hosting backup rotation and handling retained copies remain the operator’s responsibility.

The operator defaults to the owner-supplied **Ved Technologies**, and the public developer contact is `rathodar110@gmail.com`, shown in Profile, listing forms, legal pages and account deletion. Legal pages and `/api/billing/config` use this email for support when `SUPPORT_EMAIL` is unset; an explicit support email still takes precedence. The business address is omitted from public pages and configuration, as requested. Administrator access and free operation remain controlled separately.

The server serves `/.well-known/assetlinks.json` for `in.co.vedtechnologies.kosrent` with the verified certificate signing the directly distributed APK. Its public certificate is [android/upload-certificate.pem](android/upload-certificate.pem). After Play App Signing enrollment, add the actual **Play app-signing certificate** to `ANDROID_SHA256_FINGERPRINTS` (comma-separated if several are needed) and redeploy. The direct APK/upload certificate does not establish association for a build signed by Google Play. Building the Android package does not publish it or verify live OAuth/device behaviour.

Run the isolated API tests with `node --test tests/integration.test.js tests/accounts.test.js` and their documented `TEST_*` variables; run `node --test tests/android.test.js` for certificate validation.

## Admin usage analytics

Sign in with a Google account listed in `ADMIN_EMAILS`, then open Profile → Usage analytics. `/api/admin/analytics` is protected by server-side authentication and the admin email allowlist. It returns aggregate user, sign-up, rental, conversation and message counts, plus 30 days of daily trends, without user identities or message content. Active users are signed-in accounts making foreground requests, counted once per India calendar day; website and Android activity are combined. Guests and app downloads are not measured. Tracking begins at deployment; old account registration dates remain unknown, not backfilled with invented dates. Activity records expire after 90 days and are removed on account deletion. Review the updated privacy notice and Play Data safety declaration before store submission.
