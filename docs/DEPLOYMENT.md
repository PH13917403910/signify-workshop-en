# Deployment (Railway + workshop-en.jpfamilies.com)

## Done from CLI (reference)

- Railway project: **signify-workshop-en**
- Service linked + volume mounted at **`/app/data`**
- Variables set: `NODE_ENV`, `PORT=3100`, `ADMIN_PASSWORD`, `SITE_ACCESS_CODE`, `RESEND_API_KEY`
- Repo: `railway.json` forces **Dockerfile** build (custom `server.mjs` + SQLite)

## If `railway up` times out (large `public/videos`)

Prefer **GitHub → Railway** auto-deploy:

1. Railway dashboard → project **signify-workshop-en** → **Settings** → connect **GitHub** repo `PH13917403910/signify-workshop-en`.
2. Set root directory if needed, production branch `main`, save.
3. Trigger a deploy from the dashboard (or push an empty commit).

## Custom domain

```bash
cd signify-workshop-en
railway login   # if needed
railway domain workshop-en.jpfamilies.com --json
```

Use the printed **CNAME target** in Cloudflare:

- **Type:** CNAME  
- **Name:** `workshop-en`  
- **Target:** (value from Railway)  
- **Proxy:** DNS only (grey cloud) — Railway terminates TLS  

## Smoke test (local)

```bash
npm install
npm run build
npm run dev
# Home → Access → Join → Stage 1 → game → poll
```

## Troubleshooting: build OK, deploy fails on “Create container”

If **Initialization** and **Build** succeed, but **Deploy → Create container** fails with something like:

- `DEADLINE_EXCEEDED`
- `failed to pull/unpack image`
- `dial tcp ... production-us-west2.railway-registry.com ... i/o timeout`

then the image was built but the **runtime host could not pull it from Railway’s registry** in time. That is usually **transient infrastructure / network** on Railway’s side (especially `us-west2`), not an app bug.

**What to try (in order):**

1. **Redeploy** the same service (dashboard **Redeploy**, or CLI from repo root):  
   `railway redeploy -y`
2. Wait 15–30 minutes and redeploy again (registry blips often clear).
3. Check [Railway status](https://status.railway.app/) for incidents.
4. In the service **Settings → Regions**, try another region for a new deployment (if your plan allows), then redeploy.
5. If it keeps failing, open a ticket with Railway and attach the deployment ID and the full error line (registry URL + timeout).

**Note:** Large Docker layers (e.g. bundled `public/videos/*.mp4`) make pulls slower; they do not cause this error by themselves, but they make successful pulls take longer—another reason transient timeouts show up more often.
