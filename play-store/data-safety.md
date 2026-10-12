# Data safety preparation — owner review required

This describes the inspected code, not a completed Play Console declaration. Confirm current Google definitions, actual providers, production logging and retention before submitting. Hosting settings may change these answers.

| Data in the code | Use and visibility |
| --- | --- |
| Google ID, name, email | Account authentication, profile and administration. No Google password is collected. |
| Owner phone number | Displayed to signed-in viewers for calls. Owner enters it as part of listing creation. |
| Exact property address and locality | Rental search and listing details. No device GPS permission is requested. |
| Property photos, description and listing content | Owner-submitted content displayed with the listing. Users should not upload sensitive documents. |
| Private in-app messages and read cursors | Messaging between participants and unread counts. Messages are stored on the server and are not end-to-end encrypted. |
| Favourites, reports, blocked-user records, policy acceptance | Saved homes, safety/moderation and consent records. |
| Account-linked daily activity | Admin usage analytics. One account/day, retained up to 90 days and removed on account deletion. No guest analytics identifiers; website and Android usage combined. |
| Session cookie and infrastructure metadata | Authentication, rate limiting, security and operation. Confirm actual hosting access logs and retention. |
| Historical UPI references | Legacy records may exist; current free-launch code refuses renewal payments. No banking passwords or payment PINs are collected. |

Google handles sign-in; Railway is the documented hosting/database provider. Distinguish service-provider processing, user-initiated publication and other transfers using Google's current definitions rather than assuming everything is “not shared.” No ad/analytics SDK, advertising ID or native tracking SDK is configured in the Android wrapper.

HTTPS is required in production. The app includes account and associated-data deletion at `/delete-account` and Profile → Delete account. It removes active database records and revokes sessions; it cannot recall copies saved by other people or immediately erase hosting backups. The operator must establish backup retention and honour deletions if restoring a backup.

The privacy page needs a real operator identity/contact. Account creation/sign-in and listings involve personal information: do not select “no data collected.” The owner is responsible for the final truthful declaration.
