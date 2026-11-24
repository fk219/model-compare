# Model Arena: web client

React 19 + Vite front end for Model Arena (formerly AI Battle Arena). See the [root README](../README.md) for the product overview, API contract, limits, and sharing behavior.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

The client talks to the production API at `https://ai-battle-arena-4jxh.onrender.com`. The API URL lives in `src/features/chat/services/chat.api.js`. Fighter options come from `GET /api/models`, with a bundled fallback catalog if that request fails. The selected pair is saved in `localStorage` under `ai-battle-arena:model-pair:v1`. Shared report links are encoded entirely in the URL hash (`#b=...`), so static hosting needs no extra route.

`/privacy` and `/terms` are handled by a small pathname guard in `src/app/App.jsx`. `vercel.json` rewrites unknown paths to `index.html`, so direct loads work in production. `public/robots.txt` and `public/sitemap.xml` point crawlers at the home, privacy, and terms URLs. Vercel Web Analytics is mounted once in the app root and needs no environment variables.
