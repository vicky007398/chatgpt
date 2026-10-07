# Le Vech

A responsive Gujarat property marketplace prototype, built with React and Vite. Includes English/Gujarati interface, property and district/budget filters, saved listings, listing details, local seller drafts, and an in-app chat demonstration.

## Run

Use Node.js 22 or newer. From `/workspace/chatgpt`:

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

Build with `npm run build`. Serve the production build with `npm run preview`.

## Current scope

This is an interactive local prototype, not a live marketplace. Sample properties are illustrative, not real offers. Saved properties, drafts, reports, and chat messages use browser localStorage. Messages are not delivered to other users. Clearing browser storage removes this data. Do not enter sensitive personal data in the prototype.

No payments, fees, commissions, WhatsApp contact links, or OTP service. Google sign-in is deliberately marked as not connected rather than simulated. Phone numbers on local drafts are never displayed to buyers. Contact-pattern blocking is a demonstration, not a complete privacy guarantee.

## Required before public launch

- Connect Google OAuth to server-verified sessions; configure permitted origins and secure account handling.
- Add a persistent database, private image storage with validation, authenticated APIs, and enforce owner-only listing edits and participant-only chat access on the server.
- Add listing moderation, report handling, user blocking, seller management, and sold status. Gate public listings on review.
- Load an authoritative Gujarat district/taluka/village directory. The current form accepts village/town text; district names are English.
- Complete Gujarati coverage for forms and dynamic content. Property titles remain seller-provided.
- Expand single-photo drafts to multiple-photo uploads and galleries.
- Add privacy notice, retention/deletion controls, abuse prevention, rate limits, and accessibility review.
- Replace external sample photos and fonts with approved self-hosted assets where appropriate.

Google sign-in verifies an account, not identity or property ownership. Property documents and authority to sell need separate checks. Never store credentials in source files.
