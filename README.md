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

Photos are stored as binary data in PostgreSQL, so they survive deploys without a filesystem volume. Limit: six JPEG/PNG/WebP photos, 3 MB each. This is suitable for an initial smaller deployment; monitor database storage and move photos to object storage as usage grows. Configure Railway backups for your database. Session storage is PostgreSQL-backed. HTTPS secure cookies, same-origin mutation checks, rate limits, server-side ownership and conversation-participant checks are enabled. Phone numbers are private and omitted from public listing and conversation responses. Google authenticates accounts; it does not verify identity or legal ownership. Review does not certify ownership.

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
