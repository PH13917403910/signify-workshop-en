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
