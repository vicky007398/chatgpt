# KosRent — Railway deployment

React + Node.js + PostgreSQL property marketplace for Gujarat. Google accounts, shared listings, owner edits, administrator review, private in-app messaging, photo uploads, saved favourites, and English-only interface. No payments, commissions, WhatsApp integration, or SMS OTP.

## Deploy from GitHub to Railway

1. In Railway, create a project and add **PostgreSQL**.
2. Add a service using **Deploy from GitHub repo**, select this repository.
3. In the app service, configure `DATABASE_URL` using a Railway reference to the PostgreSQL service's `DATABASE_URL`. Prefer Railway's private database connection.
4. Add these app service variables:
   - `SESSION_SECRET`: generate a random secret with at least 32 characters, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep it private and stable across deploys.
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: from the Google OAuth web application described below.
   - `APP_URL`: the complete HTTPS public app origin, e.g. `https://your-service.up.railway.app`, without a trailing slash.
   - `ADMIN_EMAILS`: comma-separated Google email addresses allowed to review listings. Use your own Google email.
5. Generate a public domain in the app service's Networking settings. Set `APP_URL` to that domain, then redeploy if necessary.
6. Railway uses `npm run build` and `npm start`; `/api/health` checks database connectivity. Tables are created on first startup. Never commit `.env` or credentials.
7. Sign in with your admin account. Review new listings in **Review**. Only approved listings appear to buyers. Edits return to review; after approval, users see updates within 5 seconds. Messages update within 3 seconds.

Railway publishes the website. Publishing a Codex environment does not deploy this app.

## Google login (required)

In Google Cloud Console, create a project, configure the OAuth consent screen (Google Auth Platform), and create an OAuth client with application type **Web application**. Request only openid, email and profile.

Add your Railway origin as an authorised JavaScript origin and this exact authorised redirect URI:

```
https://YOUR-RAILWAY-DOMAIN/auth/google/callback
```

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

Photos are stored as binary data in PostgreSQL, so they survive deploys without a filesystem volume. Limit: five JPEG/PNG/WebP photos, 3 MB each. This is suitable for an initial smaller deployment; monitor database storage and move photos to object storage as usage grows. Configure Railway backups for your database. Session storage is PostgreSQL-backed. HTTPS secure cookies, same-origin mutation checks, rate limits, server-side ownership and conversation-participant checks are enabled. Phone numbers are private and omitted from public listing and conversation responses. Google authenticates accounts; it does not verify identity or legal ownership. Review does not certify ownership.

Buyers and sellers can report listings and conversations, and block conversations. Admins can remove reported listings. Contact-pattern filters reduce external contact sharing but cannot catch every disguised phone number or image. No attachments in chat.

## Known remaining launch work

- Village/town entry is free text, not an authoritative district → taluka → village directory. Connect an official current Gujarat directory before claiming that selection is implemented.
- District names, unit names and a few administrative/error labels remain English; seller-written content is not automatically translated.
- Add privacy/terms documents, deletion/export policies, operational monitoring and a fuller moderation workflow before broad public launch.
- End-to-end Google sign-in must be tested with your real OAuth credentials and Railway domain; those are not supplied with this code.

## Checks

`npm run build` builds the UI. `node --check server/index.js` checks server syntax. `node --test tests/integration.test.js` runs database-backed API checks against an isolated test database with a running server; see the test file for required environment variables. Never use production data for tests.

## Rental-only update
KosRent accepts house rentals only, with 1/2/3 BHK, exact address, monthly rent and a non-negative deposit. Area is in sq ft. Approved rentals appear on Home; marking a home rented hides it from new searches. Legacy sale listings are retained but excluded from rental screens. Two entry points support finding a home or listing one for rent. No paid plans or payments are enabled.

KosRent interface language is English only. Language switching is disabled; user-entered listing content is preserved as entered.

## Kosamba-only PWA

KosRent now serves rentals in Kosamba, Surat only. The home screen has two large actions followed by available rentals. Location selectors are removed; the listing form and server require Kosamba/Surat. Existing out-of-town listings remain stored but do not appear on the public feed. Google sign-in settings and your domain stay unchanged.

PWA files are in `public/manifest.webmanifest`, `public/sw.js`, `public/offline.html`, and `public/icons/`. Deploy over HTTPS. On Android Chrome, use the download icon when an installation prompt is available, or the browser's Install app / Add to Home screen menu. On iPhone, use Safari → Share → Add to Home Screen. Installation UI depends on browser/device support. Test on real devices after Railway deployment. The offline screen is available, but current listings, accounts and messages require a connection. The worker does not cache API or OAuth traffic.

For Google Play, package the deployed PWA as an Android Trusted Web Activity (for example using Bubblewrap) or use a suitable Android wrapper. A Play Console account, signed Android App Bundle, verified domain association (`.well-known/assetlinks.json` for a TWA), privacy policy, Data safety declarations and applicable store testing/review are separate release steps. No Android bundle or Play Store release has been created in this update.

## Rental form fields

Owner names are trimmed, repeated spaces removed, and words capitalised when saved. Choose one of the seven configured Kosamba localities, enter the exact address, upload up to five photos (3 MB each), choose furnishing, BHK/area, rent and deposit, and provide a private phone number. Optional Google Maps URLs are displayed as non-clickable reference text, not a navigable link. A user can still copy text; this is not an access restriction on the location. Existing listings need locality/furnishing selected when next edited. Public API responses continue to omit phone numbers.

## Listing periods, manual UPI renewals and policies

A listing gets 30 days on first approval. Edits/reapproval do not reset its original expiry. Existing approved ads receive 30 days from this migration's first startup. Expired ads are excluded from public listings and new conversation creation without deleting owner data or old conversations. My listings displays the expiry and an in-app reminder during the last seven days; there are no email/push reminders yet.

A manually verified renewal adds 30 days from the later of existing expiry and verification time. Price is ₹100 total per listing; there are no automatic debits. Payment requests require current policy acceptance and a 12-digit UPI reference. Only the owner can submit; only an admin can verify. References are unique. Transactional locking prevents the same request being verified twice. Admins must independently confirm actual ₹100 receipt in bank/UPI records. No gateway or banking verification is connected. A screenshot is not sufficient proof.

Paid collection is disabled by default. In Railway, set `OPERATOR_NAME` (legal/business name), `SUPPORT_EMAIL` (monitored public email), `BUSINESS_ADDRESS` (business correspondence address), `UPI_ID`, and `UPI_PAYEE_NAME` (actual payee name). Read and review `/legal/terms`, `/legal/privacy` and `/legal/refunds`, including operational commitments to respond to complaints, verify payments, and process refunds. Enable `BILLING_ENABLED=true` only after the values and procedures are correct. Publish the same legal identity/payee users will see. Never enter UPI PINs or banking passwords. If any required field is missing, the server will refuse payment requests even when the flag is true.

Owners submit the UPI reference in Profile → My listings → Listing renewals. Review → Payment verification shows pending requests. Verify only after confirming receipt, or reject with a visible explanation. An expired home returns to public search only after a verified extension and provided the listing remains approved. Paid renewal never overrides moderation. Handle eligible refunds manually through the original payer's supported payment route and retain the relevant records; no refund API is implemented. Rent and security deposits are not processed by KosRent.

Legal pages draw operator details from environment settings, list policy version, and remain accessible without login. Listing publication/edit and renewal require express consent recorded server-side. These are policy templates tied to current app behaviour, not a guarantee against disputes; have Indian legal/tax advice before collecting public payments. A Play Store package for a paid digital listing service may need Play Billing or an applicable permitted alternative: do not assume this web UPI flow is automatically allowed in a store release.

## Free launch — current mode

KosRent is free until an explicit later code update. Renewal collection is disabled in the server regardless of an old BILLING_ENABLED value. Public listing/chat queries ignore stored expiry dates; approved Kosamba rentals remain visible until rented/removed/moderated. Owner screens and policies no longer advertise fees or expiry reminders. Old expiry dates and payment records are retained for record keeping, but do not authorise future charging. No timed switch to paid mode is scheduled. Reintroduce paid plans only with advance notice, updated terms and fresh consent. Keep BILLING_ENABLED=false in Railway as well.

## Immediate publication

Valid new Kosamba rental listings publish immediately, without administrator approval. Active listing edits stay public. Existing pending Kosamba house rentals are released when the updated server starts. Removed, rejected and rented listings are not restored by this migration or an ordinary owner edit. Reporting and administrator removal remain available. Listings are owner-provided and are not verified by KosRent.

## Installed mobile display

The manifest requests fullscreen, with standalone fallback for compatible browsers. viewport-fit=cover, dynamic viewport sizing and safe-area insets support varied phone dimensions and notches. iOS home-screen metadata is supplied, but system status/navigation bars and display-mode support are controlled by the OS/browser. No guarantee of immersive fullscreen on every mobile platform. After deployment, existing installs may update their manifest asynchronously; reopening or reinstalling may be needed to pick up a new display mode. Browser-simulated checks covered 320/360/390/430-pixel phones, tablet and landscape, admin controls, bottom navigation, full-height form and viewport resizing. Validate actual installed behaviour on Android and iPhone before claiming device-specific results.

## Chat interface and in-app unread counts

Mobile chat uses a conversation list and separate thread with a back button, incoming/outgoing bubbles, date separators and a bottom composer. Desktop uses two panes. Block/report controls have been removed from the chat UI; listing reports remain available. Existing server-side blocking preferences are preserved. Messages refresh every 1.5 seconds while a visible thread is open; conversation previews and unread badges refresh every 2 seconds while the app is visible. Sends display immediately after server confirmation. There are no operating-system push notifications or background delivery guarantees.

Read cursors are stored per user/conversation in PostgreSQL, indexed by message sequence. Viewing a thread marks only the fetched message cursor read; other users' counts and newer messages are not cleared. Unread counts appear on each chat and the Chats navigation icon and survive reloads. Tests covered real local PostgreSQL with synthetic sessions; Google login and on-device deployment should still be checked after Railway redeployment.
