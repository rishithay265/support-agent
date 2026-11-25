# Amplitude Academy learning workspace

A responsive MVP learning portal for the supplied Academy playlist. The 98 provided URL entries are represented in `data/video-ids.json`; the seed deduplicates them to 97 YouTube IDs, including the repeated `j_iwGC-dSug`. The PDF was not present in the checkout, so the IDs were taken from the list in the request.

## Run locally

Requires Node.js 22.13+ (uses the experimental built-in `node:sqlite` module).

```sh
npm install
cp .env.example .env.local
npm run seed
npm run dev
```

Open http://localhost:3000. The database is also automatically initialized when the API is first called. Run `npm test` and `npm run build` to verify the project. `DATABASE_URL` is a local SQLite path of the form `file:data/academy.db`, not a PostgreSQL URL.

To run in Docker, copy `.env.example` to `.env`, optionally add keys, then run `docker compose up --build`. SQLite is persisted in a named volume. The container's data directory is initialized from the image when the volume is first created.

## What works

- Responsive dashboard, video library, embedded source videos, basic linear learning path, notes/bookmarks, editable task drafts, Markdown export, command palette, and browser-local progress.
- SQLite-backed, idempotent playlist seed. The admin screen can sync public title, description and duration metadata using `YOUTUBE_API_KEY`. A manually supplied, authorized transcript can be saved for an existing video.
- Chat refuses to invent an answer if no transcript matches. With a transcript, a matching query, `GEMINI_API_KEY`, and a valid `GEMINI_MODEL`, it calls the Gemini Interactions API **server-side** after verifying that the configured model exists. Search and URL context tools are never enabled. The default model requested in the specification may not exist or be accessible; set `GEMINI_MODEL` to an available model. Source links point to the beginning of the video; timestamp-specific retrieval is not yet implemented.

## Important MVP limitations

**This is not production-ready and must not be exposed to untrusted users or used with sensitive information.** Authentication, SSO, role enforcement, rate limits, audit logging, user isolation and cost tracking are not implemented. Admin and transcript endpoints are publicly accessible. Browser-local data is not shared across devices, and chat history/feedback are session-only. The dashboard's preview lesson labels are illustrative until metadata is synced; the preview descriptions are not claimed to summarize those videos.

YouTube Data API does not provide arbitrary public caption downloads without appropriate authorization. Automatic transcript retrieval, chapters, structured Gemini ingestion, embeddings/pgvector, true RAG, timestamp-level citations, streaming, quizzes, personalized prerequisites, re-index jobs and automatic retries are not implemented. Retrieval currently uses basic keyword matching against whole manually supplied transcripts and sends excerpts to Gemini. The model can still make mistakes; review answers against sources. Task drafts are manual, not AI-generated; PDF/DOCX export, uploads, glossary, dark mode and notifications are not implemented. This MVP uses custom CSS rather than Tailwind/shadcn.

No API key is exposed to the browser. Only explicitly entered questions and relevant transcript excerpts are sent to Gemini when a key and matching content are available. Do not add personal or confidential data to the workspace until proper authentication, authorization, retention and privacy controls have been implemented.

## Vercel preview

Vercel deployments run in a read-only, serverless preview mode: the 97 seeded IDs are available from an in-memory database, while metadata sync and transcript uploads are disabled rather than silently losing data. Progress, notes, and drafts remain local to the browser. No AI knowledge is indexed in this preview. Persistent shared storage, authentication and authorization are required before enabling administration or using this with sensitive information. Configure `GEMINI_API_KEY`, `GEMINI_MODEL` and `YOUTUBE_API_KEY` only after adding those safeguards and a persistent data backend.
