# AI Battle Arena

Two language models answer the same prompt. A third model judges both answers, scores them out of ten, explains the scores, and declares a winner. Then you can share the scorecard, export it, or keep a running record of who wins your prompts.

**Live app:** https://ai-battle-arena.furqankhan.dev
**API:** https://ai-battle-arena-4jxh.onrender.com

![AI Battle Arena](docs/preview.png)

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Node](https://img.shields.io/badge/Node.js-22-5FA04E?logo=node.js&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-orchestration-1C3C3C)
![Render](https://img.shields.io/badge/API-Render-46E3B7)
![Vercel](https://img.shields.io/badge/Web-Vercel-000000?logo=vercel&logoColor=white)

## The idea

Public benchmarks are averages. What people actually feel is how two models handle *their* question. This app turns a single request into a head-to-head bout: Cohere and Groq each answer it, a judge scores both sides on a 0–10 scale, explains the decision, and the result becomes evidence you can share with your team.

It is built for the moment before a model choice: a developer or PM comparing two options on the prompts their workflow actually uses.

## Features

- **Head-to-head answers** from Cohere and Groq on the same prompt, generated in parallel.
- **Judge evidence**, not just numbers: each corner gets the judge's written reasoning, plus a compact verdict line explaining why the winner won (lifted from the judge's own feedback).
- **Shareable battle reports**: one click packs the prompt, both answers, scores, reasoning, and winner into a compressed URL-safe payload at `#b=<payload>`. Opening that link boots a read-only report with a "Run your own battle" path back into the arena.
- **Markdown export** of the full report for docs, tickets, or a team wiki.
- **Personal leaderboard** in the fight card: total bouts, wins per model, draws, and average score per model, computed from saved bouts.
- **Battle history** kept in `localStorage`, with numbered bouts, timestamps, and the last active battle restored on reload.
- **Cost and abuse protection**: per-IP rate limits, prompt length caps, a 60-second server timeout, and an in-memory LRU cache so repeated prompts do not re-bill the model APIs.
- **Starter prompts** for the empty state, so the first visit is not a blank page.
- **Copy any answer** with a short confirmation.
- **Error recovery**: failed battles show a dismissible banner with a retry action. Rate limits and timeouts get specific messages.
- **Broadcast UI**: fight-card rail, prompt card, split duel with a `VS` seam, and a judges' scorecard. Responsive from 320 px up, with visible focus states and `prefers-reduced-motion` support.
- **Keyboard-first composer**: `Enter` sends, `Shift` + `Enter` adds a line.

## Architecture

```
React client (Vercel)
      │  POST /api/invoke { problem }
      ▼
Express API (Render)
      │
      ├── helmet + CORS
      ├── per-IP limits: 6/min, 40/hour
      ├── prompt validation: 2,000 chars
      ├── LRU cache: 100 entries, 30 min TTL
      ├── 60s timeout guard
      ▼
LangGraph StateGraph
   ├── solutionNode ──► Cohere  ┐
   │                  Groq      ├─ run in parallel
   └── judgeNode ─────► Groq ───┘  structured output (zod)
      │
      ▼
{ solution_1, solution_2, judge: { scores, feedback, winner } }
```

The judge uses a provider-enforced structured output schema, so scores and winner come back as typed data instead of text that has to be parsed.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, hand-written CSS design system, `lz-string` |
| Backend | Node.js, Express 5, TypeScript, `tsx` |
| Orchestration | LangGraph (`StateGraph`) |
| Models | Cohere, Groq (responses), Groq (judging), optional Gemini and Mistral clients included |
| Validation | zod v4 structured output |
| API hardening | `helmet`, `express-rate-limit`, in-memory LRU/TTL cache |
| Hosting | Vercel (web), Render (API) |

## Project structure

```
backend/
  server.ts                   Express bootstrap
  tsconfig.json               Type-check configuration
  src/app.ts                  API, CORS, hardening, cache wiring
  src/ai/graph.ai.ts          LangGraph battle graph
  src/ai/models.ai.ts         Provider clients
  src/config/config.ts        Environment config
  src/lib/lruCache.ts         100-entry / 30-min in-memory LRU cache
  src/lib/prompt.ts           2,000-character validation + cache keys
  src/lib/rateLimit.ts        Per-IP minute and hour limiters
  src/lib/timeout.ts          60s Promise.race guard
frontend/
  src/features/chat/
    page/ChatPage.jsx          Arena state, saved-card hydration, shared-link routing
    page/SharedReportPage.jsx  Read-only shared report shell
    components/               Fight card, record strip, battle view, composer, empty state
    lib/battles.js            Storage, formatting, verdict and error helpers
    lib/share.js              `#b=` encode/decode, limits, shared-link errors
    lib/report.js             Markdown report builder and download
    lib/stats.js              Personal leaderboard aggregation
    lib/limits.js             Shared prompt-length constant
    services/chat.api.js      API client
  src/app/App.css             Design system and layout
```

## Run locally

```bash
# API
cd backend
npm install
cp .env.example .env       # fill in the keys
npm run dev                # http://localhost:3000

# Web
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Type-check the API with `npm run typecheck`. Lint and build the web app with `npm run lint` and `npm run build`.

### Environment variables

| Key | Purpose |
|---|---|
| `PORT` | API port (Render provides this in production) |
| `COHERE_API_KEY` | Cohere answers (required) |
| `GROQ_API_KEY` | Groq answers and judging (required) |
| `GOOGLE_API_KEY` | Optional Gemini client, not on the main path |
| `MISTRALAI_API_KEY` | Optional Mistral client, not on the main path |

Only `COHERE_API_KEY` and `GROQ_API_KEY` are required to start the API. No new environment variables are required for sharing, caching, or rate limiting.

## API

`POST /api/invoke`

```json
{ "problem": "Explain database indexes to a junior developer" }
```

```json
{
  "success": true,
  "message": "Graph Executed Successfully!",
  "cached": false,
  "result": {
    "solution_1": "...",
    "solution_2": "...",
    "judge": {
      "solution_1_score": 8,
      "solution_2_score": 7,
      "solution_1_feedback": "...",
      "solution_2_feedback": "...",
      "winner": "solution_1"
    }
  }
}
```

`cached: true` means the response came from the in-memory cache and no model call was made. The `result` shape is unchanged.

### Error responses

| Status | Body | Cause |
|---|---|---|
| `400` | `{ "error": "...", "code": "PROMPT_TOO_LONG" }` | Prompt over 2,000 characters, empty prompt, bad JSON, or oversized body |
| `429` | `{ "error": "...", "retryAfter": 42 }` | More than 6 requests/minute or 40/hour from one IP; also sends `Retry-After` |
| `504` | `{ "error": "...", "code": "TIMEOUT" }` | Model work exceeded 60 seconds |
| `500` | `{ "error": "..." }` | Upstream/provider failure |

`GET /health` returns `{ "ok": true, "uptime": 123 }` where `uptime` is process uptime in seconds. `GET /` still returns the plain health string.

## Limits and abuse protection

| Control | Value |
|---|---|
| Prompt length | 2,000 characters (enforced on client and server) |
| Burst limit | 6 requests / minute / IP |
| Hourly limit | 40 requests / hour / IP |
| Upstream timeout | 60 seconds |
| Response cache | 100 entries, 30-minute TTL, keyed by trimmed prompt |
| Share link payload | 16,000 encoded characters |

The cache and rate limits are **process-local and in-memory**. They reset when the API restarts or redeploys and are not shared across instances. There is no database. The timeout ends the client request but does not cancel model calls already in flight; use a shorter prompt if provider latency is consistently high.

## Sharing and export

- **Share report** compresses `{ prompt, answers, scores, feedback, winner, date }` with `lz-string`'s `compressToEncodedURIComponent` and places it at `#b=<payload>` in the current URL. The link is copied to the clipboard when the browser allows it.
- Opening a `#b=` URL mounts a read-only report: no fight card, no composer, and no `localStorage` write. The shared report is labelled clearly and offers **Run your own battle**.
- Corrupt or oversized payloads show a friendly error instead of a broken page. Reports that would exceed the 16,000-character encoded limit are rejected with a pointer to **Export report**.
- **Export report** downloads a Markdown file containing the prompt, both answers, scores, judge reasoning, verdict, and winner.
- Shared content lives entirely in the URL. Anyone with the link can read it, and chat apps may truncate very long URLs. Treat shared prompts and answers as public, and prefer export for long or sensitive reports.

## Deployment notes

- The API runs on Render's free plan, so the first request after idle can take ~50 seconds to wake. The 60-second bout timeout still applies after the request starts.
- The client calls the Render API directly; CORS is restricted to the production domain plus localhost.
- Rate limiting uses `trust proxy` set to 1 so the client IP comes from the hosting proxy.
- `frontend/vercel.json` rewrites client routes to `index.html`. Share links use the URL hash, so no server route is needed.
