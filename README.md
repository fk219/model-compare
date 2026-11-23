# AI Battle Arena

Two language models answer the same prompt. A third model judges both answers, scores them out of ten, explains the scores, and declares a winner.

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

Model benchmarks are averages. What people actually feel is how two models handle *their* question. This app turns a single request into a head-to-head: Cohere and Groq each answer it, then a judge scores both sides on a 0–10 scale and explains the decision.

## Features

- **Head-to-head answers** from Cohere and Groq on the same prompt, generated in parallel.
- **Judge scorecard** with per-model scores, written reasoning, and a winner (or a tie).
- **Battle history** kept in `localStorage`, with numbered bouts, timestamps, and the last active battle restored on reload.
- **Starter prompts** for the empty state, so the first visit is not a blank page.
- **Copy any answer** with a short confirmation.
- **Error recovery**: failed battles show a dismissible banner with a retry action instead of silently dying.
- **Broadcast UI**: fight-card rail, prompt card, split duel with a `VS` seam, and a judges' scorecard. Responsive from 320 px up, with visible focus states and `prefers-reduced-motion` support.
- **Keyboard-first composer**: `Enter` sends, `Shift` + `Enter` adds a line.

## Architecture

```
React client (Vercel)
      │  POST /api/invoke { problem }
      ▼
Express API (Render)
      │
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
| Frontend | React 19, Vite, hand-written CSS design system |
| Backend | Node.js, Express 5, TypeScript, `tsx` |
| Orchestration | LangGraph (`StateGraph`) |
| Models | Cohere, Groq (responses), Groq (judging), optional Gemini and Mistral clients included |
| Validation | zod v4 structured output |
| Hosting | Vercel (web), Render (API) |

## Project structure

```
backend/
  server.ts                 Express bootstrap
  src/app.ts                API + CORS
  src/ai/graph.ai.ts        LangGraph battle graph
  src/ai/models.ai.ts       Provider clients
  src/config/config.ts      Environment config
frontend/
  src/features/chat/
    page/ChatPage.jsx       Screen state and composition
    components/             Fight card, battle view, composer, empty state
    lib/battles.js          Storage, formatting, score helpers
    services/chat.api.js    API client
  src/app/App.css           Design system and layout
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

### Environment variables

| Key | Purpose |
|---|---|
| `PORT` | API port (Render provides this in production) |
| `COHERE_API_KEY` | Cohere answers |
| `GROQ_API_KEY` | Groq answers and judging |
| `GOOGLE_API_KEY` | Gemini client (included, not on the main path) |
| `MISTRALAI_API_KEY` | Mistral client (included, not on the main path) |

## API

`POST /api/invoke`

```json
{ "problem": "Explain database indexes to a junior developer" }
```

```json
{
  "success": true,
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

`GET /` returns a health string.

## Deployment notes

- The API runs on Render's free plan, so the first request after idle can take ~50 seconds to wake.
- The client calls the Render API directly; CORS is restricted to the production domain plus localhost.
- `frontend/vercel.json` rewrites client routes to `index.html`.
