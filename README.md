# Nufa Media

A responsive React and TypeScript website inspired by the client-approved [Nufa demo](https://nufamedia.ai.studio/), with Sanity Studio and an editable page builder.

## Develop

Use Node.js **22.12 or newer** (tested with Node 24) and npm.

```sh
npm ci
npm run dev
```

The website uses Vite. `npm run build` creates `dist/`; `npm run preview` serves that production build. Fonts and starter artwork are local, so the website doesn't depend on the demo's image URLs.

## Sanity: first-time setup

This repository is configured for the new **Nufa Media** project, ID **`2bndbdfg`**, public dataset **`production`**. It does not use the portfolio project. Project IDs are public identifiers; there is no API token in the frontend.

1. In [Sanity project settings](https://www.sanity.io/manage/project/2bndbdfg), open **API → CORS origins**. Add your website origin and allow credentials because Studio is embedded in the website. For development, add `http://localhost:5173`, `http://127.0.0.1:5173`, and `http://localhost:3333`; add the exact production origin after deploying. Avoid wildcard credential origins.
2. Open `/studio` on the website, or run `npm run studio` for the standalone Studio.
3. Sign in with a Sanity account that has Editor or Administrator access to this project.
4. Open **Starter content → Import starter content**. This creates the Home and Site settings documents. Repeating the import preserves existing documents and edits.
5. Edit **Content → Site settings** for contact email, WhatsApp, telephone, office details, brand name, navigation, and footer links.
6. Edit **Content → Home → Content blocks**. Add, remove, or drag blocks into your preferred order. Publish changes to update the website. The public API CDN may take about a minute to reflect a new publication; refresh the website to load it.

The dataset is initially empty. The website shows the bundled starter content until those documents are published. Network failures also retain a working starter overview and show a notice. Published pages with an intentionally empty block list remain empty.

The first hosted import requires your authenticated Sanity session. Creating the project and configuring its public ID does not grant this checkout permission to write to your dataset.

### Content blocks

- Hero with replaceable background image, heading, copy, buttons, and caption
- Text strip for capabilities or approved partner names
- About / philosophy with values and supporting image
- Services with numbered descriptions and supporting image
- Projects with images and accessible detail dialogs
- Process steps
- FAQ
- Contact with editable form labels and placeholders
- Rich text (headings, lists, links, and quotes)
- Image / banner

Add extra pages in **All pages**. A page with slug `about` is available at `/about`; the home slug is `home`. Link to additional pages using `/about` in navigation. Section anchors must be unique within a page. When removing a section, update any navigation or button links that point to it.

Starter project examples are labelled **Studio concept**. Replace their artwork, descriptions, and labels with verified client work. The demo's example client logos, results, addresses, and phone numbers were not treated as verified business facts.

### Contact behaviour

Contact coordinates start blank and are editable in Site settings. The form prepares a project brief; it does **not** silently send an email or store personal information. Once an email or WhatsApp number is published, visitors can open a prefilled email draft or WhatsApp conversation. Copy and download are available too. Until then, the form clearly says the brief has not been sent. A server-side form provider can be added later if automatic delivery is wanted.

### Configuration overrides

The public project and dataset are already configured. To override them, copy `.env.example` to `.env.local`. For standalone Studio, use `studio/.env.example` as a guide. Set identifiers only; never place write tokens in `VITE_` or `SANITY_STUDIO_` variables.

For an optional authenticated CLI import:

```sh
# Supply SANITY_WRITE_TOKEN securely in your local process environment.
# Never commit the token or put it in frontend variables.
npm run cms:seed
```

The Studio import tab is the recommended option and needs no token handling.

## Validate

```sh
npx playwright install chromium  # unnecessary when system Chromium is available
npm test                       # production build + desktop/mobile browser tests
npm run studio:build           # standalone Studio build
npm run format:check
```

Browser tests use controlled CMS responses to verify published edits, block ordering, empty pages, custom pages, image replacement, contact channels, fallback handling, dialogs, and mobile navigation. The optional `node scripts/verify-live.mjs` checks the real read-only dataset and the connected Studio sign-in against the running dev server. Authenticated content import is a separate operation; these tests do not claim to have signed into your account.

## Deploy the website

Use a static host with Node 22.12+, build command **`npm run build`**, and output directory **`dist`**. SPA fallback routing is needed for `/studio` and additional CMS pages. Netlify (`netlify.toml` and `_redirects`) and Vercel (`vercel.json`) configurations are included. Add the deployment's exact origin to the Sanity CORS settings with credentials before signing into its Studio.

Studio is lazy-loaded only at `/studio`; website visitors don't download the CMS application. Alternatively, `npm run studio:build` builds the standalone Studio, which can be hosted separately. Pushing this repository does not deploy a website or publish a Sanity Studio.

## Cloud environment

The checkout is `/workspace/Nufa-Media`. Cloud tasks already have an isolated checkout; use it directly and don't create a Git worktree unless explicitly requested.

Use `npm ci --cache /workspace/.npm-cache` when the home directory isn't writable. Sanity CLI config can be kept in a writable location with `XDG_CONFIG_HOME=/workspace/.nufa-runtime-config`. Required network destinations are the npm registry and the project's `2bndbdfg.api.sanity.io` / `2bndbdfg.apicdn.sanity.io`, Sanity authentication hosts, and `cdn.sanity.io` for published image assets.

The development website and Studio are live processes and must be restarted in a new task. Install and startup instructions are also saved in the environment configuration draft. Browser checks behind the cloud HTTPS proxy need access to Chromium's NSS certificate database and the environment's trusted CA; keep TLS verification enabled.
