# AI Battle Arena: web client

React 19 + Vite front end for the AI Battle Arena. See the [root README](../README.md) for the product overview, API contract, limits, and sharing behavior.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

The client talks to the production API at `https://ai-battle-arena-4jxh.onrender.com`. The API URL lives in `src/features/chat/services/chat.api.js`. Shared report links are encoded entirely in the URL hash (`#b=...`), so static hosting needs no extra route.
