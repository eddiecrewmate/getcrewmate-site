# CrewMate legal site — `getcrewmate.app`

Static hosting for CrewMate's public **Privacy Policy** and **Terms of Use**.

- `privacy/index.html` → served at `https://getcrewmate.app/privacy/`
- `terms/index.html` → served at `https://getcrewmate.app/terms/`
- `index.html` → simple landing at the apex
- `CNAME` → custom domain for GitHub Pages (`getcrewmate.app`)
- `.nojekyll` → serve files as-is (no Jekyll processing)

Source of truth for the **content** is the CrewMate app repo at `docs/legal/*.md`.
These HTML files are generated from those Markdown files. If the policy text
changes, regenerate rather than hand-editing the HTML.

---

## ⛔ STATUS: STAGED — NOT YET PUBLISHED (gated)

Go-live is intentionally held until **WeisMon Holdings LLC** is accepted by NY
(stamped Articles / DOS ID in hand), so the pages go public **once** under the
final legal name. Everything below is ready to execute in one short session.

### Already done (prep)
- ✅ Content finalized, operator named **WeisMon Holdings LLC** (7 references).
- ✅ Canonical + in-doc URLs use the trailing-slash form (`/privacy/`, `/terms/`).
- ✅ Operational claims verified against the app code (analytics 8-event allowlist,
  Gemini active / Anthropic fallback, AviationStack, Sentry PII-stripping,
  Eddie 7-day device-only chat, account-deletion cascade) — all confirmed.
- ✅ App config fix staged on CrewMate branch `chore/step9-legal-pages-prep`
  (`app.json` + `constants/legal.ts`: wrong domain `crewmate.app` → `getcrewmate.app`,
  plus trailing slashes). Ships with the next app build — see step 7.

---

## Go-live checklist (run when the LLC name is final)

1. **Create a new PUBLIC GitHub repo** (e.g. `getcrewmate-site`). Public so GitHub
   Pages is free; it holds only these public legal pages, never app source.
2. **Push these files** to the repo's default branch.
3. **Settings → Pages** → Source = deploy from branch (root). Wait for first build.
4. **Namecheap → Domain List → getcrewmate.app → Advanced DNS**, add:
   - `A   @   185.199.108.153`
   - `A   @   185.199.109.153`
   - `A   @   185.199.110.153`
   - `A   @   185.199.111.153`
   - `CNAME   www   <your-github-username>.github.io.`
   (Leave the existing email-forwarding MX records alone — they're unrelated.)
5. **Settings → Pages → Custom domain** = `getcrewmate.app`; wait for the DNS
   check to pass, then tick **Enforce HTTPS**.
6. **Verify** in a browser (and incognito):
   - `https://getcrewmate.app/privacy/` resolves and shows the policy
   - `https://getcrewmate.app/terms/` resolves and shows the terms
7. **Ship the app config fix:** merge `chore/step9-legal-pages-prep` and cut a new
   prod build so the in-app Privacy/Terms buttons point at the live URLs.
8. **App Store Connect:** set the Privacy Policy URL to `https://getcrewmate.app/privacy/`
   in the app's metadata (Step 11).

> If the policy text ever changes after launch, also bump the "Last updated" date
> in `docs/legal/*.md`, regenerate the HTML, and re-push.
