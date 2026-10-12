# Sassy & Classy — website skeleton

A branded, mobile-friendly storefront and owner studio for Mary Jane Bevil's custom T-shirt business. Based on the supplied pale-blue, teal, gold, and script artwork. The original logo lettering stays intact in the supplied image. Allura is a close script-style substitute for editable text, not a claim to identify the original font.

## Version 2 updates

- Added root `index.html` and `admin.html` entrypoints. Opening a root-published GitHub Pages site now leads directly to the storefront; `/docs` publishing still works.
- Separated the hero shirt, branding, and caption so they no longer overlap.
- Shared a font-fitting and word-wrapping algorithm between on-screen shirt text and PNG exports. Product-card sample text also fits its print area.
- Kept logo proportions intact, placed newly added pieces apart, added overlap hints, and added Clear all artwork.
- Added owner-editable Instagram, Facebook, TikTok, Pinterest, and Google Drive folder URLs. Social links appear publicly; the connected Drive shortcut stays in the owner dashboard.
- Added a Refresh requests & studio data button.

To apply this package, copy its contents into the repository root alongside your existing `docs`, `backend`, and `tests` folders, replacing the matching files. Do not delete the repository's `.git` folder. Keep any real `docs/config.js` API/Turnstile settings and backend environment settings you have already configured; this downloadable package intentionally contains placeholders.

Then commit and push. Under GitHub **Settings → Pages**, select **Deploy from a branch → main → /docs → Save** for the preview. The expected project URL is `https://ahose12.github.io/Sassy-And-Classy/`. The root redirect also supports publishing from `/ (root)`. GitHub Pages must be enabled on your account/repository; adding files alone cannot change that setting. Deployment of this revision has not been performed or verified.

If you already deployed the backend, rerun `schema.sql` to add the `settings` table without deleting your existing data, then redeploy the Worker. There are no database credentials or live integrations in this package.

## Request-to-owner flow

Submitting a connected quote sends the choices and artwork to the Worker. The Worker validates them, stores contact details in `customers`, inserts the request into `quotes`, saves private images in R2, and attempts an owner notification. The studio reads those records into **Quote requests**, where Mary Jane can open the artwork and update status. The request is retained even when notification email fails. The Refresh button fetches new requests without signing out.

The implemented database is Cloudflare D1. Supabase/Postgres or AWS can support the same workflow, but they are alternatives rather than additional services you need to run beside D1. Choosing either requires adapting the API/storage/auth configuration; no Supabase or AWS account is connected here.

## Social and Drive connections

Open **Owner studio → Connections** to set profile links and a Google Drive folder shortcut. In demo mode these are local-browser settings; with the backend they are shared records. Storefront links open in a new tab. Saving a URL does not grant the website access to the account.

For social integrations beyond links, the next stage is an explicit owner sign-in/authorization flow, server-held access tokens, and platform permissions. Possible features include publishing deals to Facebook/Instagram, importing a permitted feed, or composing posts for review. Automatic posting, social login, social messages, and imported feeds are not implemented or connected in this revision. Private customer emails and uploaded artwork are not published to socials.

The Drive shortcut opens your existing folder. Automatic copying/syncing of quote files still requires Google authorization and a server upload job; it is not implied by saving the link.

## Start here

1. Open `docs/index.html` to explore the storefront. All links and assets are relative, including GitHub project-repository paths.
2. Open `docs/admin.html`, then choose **Explore the demo dashboard**.
3. Add sample styles, pictures, deals, and email drafts. Demo changes stay in this browser and are reflected in the storefront after reload.
4. The shirt customizer works without service accounts: choose style and sizes, colors and fonts, add multiple logos and text, select print locations, drag artwork, inspect front/back, and save a PNG concept preview.
5. In preview mode a quote submission downloads a JSON draft with artwork instead of claiming to send an email. It does not save private quote/customer information in localStorage. The owner demo uses fictional example.com contacts.

This is a source package, not a deployed website. No credentials, accounts, emails, orders, payments, or live customer records have been created.

## Included capabilities

| Feature | Skeleton preview | Connected backend |
|---|---|---|
| Shirt marketplace and collection filters | Working sample collection | Owner-managed shared collection |
| Sizes and per-size quantity, shirt colors, fonts, print colors | Working | Included in the stored quote |
| Multiple logo/photo positions, text, front/back | Working, draggable | Private originals + front/back PNG previews |
| Notes, required-by date, shipping/pickup preference | Working form | Stored request and owner notification |
| Quote email | Download a draft; no mail sent | HTML notification with inline previews and originals attached |
| Owner sign-in | Separate, clearly labeled demo | Salted password check, 4-hour server sessions |
| New styles, pictures, deals | Browser-local demonstration | Shared D1 records, uploaded R2 images |
| Customer emails | Fictional examples | Private D1 list and CSV export |
| Holiday messages to selected/all users | Drafts and email preview | Confirmed subscribers only; queued individual sends |
| Marketing permission | Explicit checkbox | Confirmation email, opt-in timestamp, unsubscribe |
| Her actual Rocketmail sender | Not connected | Optional Yahoo SMTP adapter included |
| Google Drive, Stripe, Square | Not connected | Documented extension points |

## Frontend publishing

This package is GitHub Pages compatible. Upload the extracted project to a GitHub repository and select **Settings → Pages → Deploy from a branch → main → /docs**. No build step is needed. You can use GitHub Pages for reviewing the skeleton.

For the operating business site, Cloudflare Pages is the intended hosting option from our planning. GitHub's rules restrict websites primarily facilitating commercial transactions, so deploy the live quote marketplace on Cloudflare rather than treating GitHub Pages as the permanent commercial host.

For Cloudflare Pages: connect the repository, leave the build command empty, and set the output directory to `docs`. Repository code can stay on GitHub. Deploying the frontend alone still leaves it in preview mode.

## Connect the backend

Architecture:

- Static HTML/CSS/JavaScript frontend in `docs`.
- Cloudflare Worker API in `backend/worker.mjs`.
- D1: products, deals, private customers, quotes, sessions, consent, campaigns and delivery jobs.
- R2: private quote originals and preview images. Only the `media/` prefix is publicly served for owner-approved product/deal photos.
- Turnstile: required for live quote and signup forms, verified by the server.
- Email adapter: Resend with a verified business domain by default; an optional Node/Yahoo SMTP relay for sending through the existing Rocketmail mailbox.

### Cloudflare setup

Install a current Wrangler CLI and authenticate in your own terminal. From `backend`:

```sh
npx wrangler d1 create sassy-classy
npx wrangler r2 bucket create sassy-classy-private
```

Copy the returned database ID into `backend/wrangler.toml`. Set the origins and URLs to your actual site and Worker addresses. `ALLOWED_ORIGINS` contains origins only (no repository path), for example `https://yourname.github.io`. `SITE_URL` may include the GitHub project path. Configure the actual business mailing address before sending campaigns.

```sh
npx wrangler d1 execute sassy-classy --remote --file=schema.sql
```

Create a unique owner password of at least 16 characters. The helper reads the password through stdin and produces only a salted verifier. Run it locally, using a hidden prompt:

```sh
read -r -s -p 'Owner password: ' sc_owner_password
printf '%s' "$sc_owner_password" | node password-hash.mjs
unset sc_owner_password
```

Store the verifier as `OWNER_PASSWORD_HASH` using `npx wrangler secret put OWNER_PASSWORD_HASH`. Store `TURNSTILE_SECRET` the same way. Never commit the actual password, private service keys, or SMTP app password.

For the default email adapter, verify your own business domain with Resend, set `MAIL_FROM` to that verified address, and set `RESEND_API_KEY` as a Worker secret. The owner can receive quotes at `sassy_classy@rocketmail.com`; campaign replies go there too. The default adapter does not impersonate Rocketmail as a From address.

```sh
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

Set `apiBase` in `docs/config.js` to the deployed Worker URL, and `turnstileSiteKey` to your public site key. Add the website hostname to the Turnstile widget's allowed hosts. The private secret belongs only in Worker configuration. Redeploy the frontend.

The live database starts empty. Sign in and add the real collection and deals; preview products are not fabricated live inventory.

### Send directly through Mary Jane's Rocketmail address

Yahoo's documented SMTP server is `smtp.mail.yahoo.com`, with SSL on port 465 and an app password. The optional relay in `mail-relay` adapts the Worker email format to SMTP. App-password availability must be checked in Mary Jane's Yahoo account; no account access was performed here.

Deploy `mail-relay` to an HTTPS Node 24 host that allows SMTP connections and has a persistent `/data` disk. Install its dependencies (`npm install`), then set secrets:

- `SMTP_USER=sassy_classy@rocketmail.com`
- `SMTP_APP_PASSWORD`: her Yahoo-generated app password, never her normal password
- `RELAY_TOKEN`: a random token of at least 32 characters
- `RELAY_DB_PATH=/data/mail-jobs.sqlite`

Start with `npm start`. Set Worker `EMAIL_PROVIDER=smtp-relay`, `SMTP_RELAY_URL=https://YOUR-RELAY/send`, and the same private `SMTP_RELAY_TOKEN`. `MAIL_FROM` is ignored in this mode; the SMTP adapter always sends from the authenticated mailbox. The relay stores delivery keys to avoid duplicate mail. Ambiguous crash-in-progress deliveries require manual review. Confirm the mailbox's sending limits before using it for marketing campaigns; a dedicated marketing provider is a better growth path.

## Owner workflow

1. Log in from **Owner studio** in the footer.
2. Add or edit styles under **Collection**, and updates under **Deals & updates**.
3. Open **Quote requests** for quantities, text/font/positions, notes, and private image downloads. Change status to new, quoted, in production, or complete.
4. See **Customers** for quote contacts and subscription state. Only confirmed marketing subscribers can receive campaigns.
5. Use **Email campaigns** to choose specific subscribers or all confirmed subscribers, write a subject/message, save drafts, and review recipients before sending.
6. Cron runs every minute and sends queued campaign messages in small batches. Reopen the dashboard to refresh delivery counts. Counts show acceptance by the email provider, not guaranteed inbox delivery.

If owner notification fails, the quote is retained and the customer sees "saved, notification pending." The dashboard records the failed email state; quote notifications are not automatically retried in this skeleton. Failed campaign jobs retry up to three attempts. A subscriber who opts out after queueing is suppressed before their queued message is sent.

## Future integrations

**Google Drive:** R2 is the working private-upload store in this skeleton. To add Drive copying, provision a dedicated destination folder and server-side OAuth/service credentials, then add an asynchronous upload step after quote storage. Keep those credentials outside the static frontend. Drive sync is not implemented here.

**Stripe/Square:** Keep this as a quote-first flow. After reviewing the design, send a processor-hosted payment link for the agreed total, or add an owner action that creates the link server-side. Verify processor webhooks before marking orders paid. No checkout or payment processing is included.

**Growth:** Add verified bounce/complaint webhooks and suppression handling, pagination, owner MFA, backup/retention tools, automated quote notification retries, and an order/payment model before expanding into a full operating storefront. This skeleton has one owner account; it is not multi-user staff administration. Automatic password recovery is not included; rotate the secret verifier manually. Changing it does not revoke existing sessions—delete `sessions` to revoke all logins.

## Design and assets

All 11 supplied assets are included in `docs/assets` with simple web-safe filenames. The logo/business cards preserve their original script lettering. The page uses teal `#195b60`, pale blue `#e3f3fa`, soft mint, gold, and a warm neutral background. Editable type uses Allura (script), Playfair Display (headings), and DM Sans (body), with system fallbacks if Google Fonts is unavailable.

The customizer is a concept preview. Its illustration is a generic crew-neck shape; long-sleeve/youth selections are recorded for quoting rather than represented as accurate garment geometry. Sleeve labels are wearer-relative, and final print dimensions, alignment, artwork fidelity, availability, and price are confirmed by Mary Jane. PNG preview exports are concept images, not print-ready production artwork.

## Verification

Run `node --test tests/backend.test.mjs tests/layout.test.mjs` and `python3 tests/static-check.py` from the project root. These verify private route access, origin checks, password verification, validated quotes, subscription state, campaign selection, inline attachments, schema constraints, private Drive settings, public social links, text fitting, logo aspect ratios, root entrypoints, local asset links, and JavaScript syntax. Browser visual QA and live email/account integration testing still require your deployment environment.

Official setup references:
- https://developers.cloudflare.com/workers/
- https://developers.cloudflare.com/d1/
- https://developers.cloudflare.com/r2/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://resend.com/docs/api-reference/emails/send-email
- https://resend.com/changelog/embed-images-using-cid
- https://help.yahoo.com/kb/SLN4075.html
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
