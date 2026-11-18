# SamePage

A web app that helps teams resolve conflict and work on team goals through short, AI-generated trainings approved by a manager. See [docs/specs.md](docs/specs.md) for the product spec.

## Prototype

The live site is a prototype of Prototype 1's screens: the member check-in (with Review summary), past trainings, and the manager dashboard, training wizard, slide editor, team growth and settings.

- **No database.** Everything is saved in each browser's localStorage. The team, its goals, the anonymous team summary, the growth chart and past trainings are sample data.
- **The AI steps are real** and call Claude:
  - Check-in: summarizes the member's answers (only the summary is kept)
  - New training: topic suggestions, subtopic plan, and the full slide deck with speaker notes, plus checked YouTube videos
  - Slide editor: "Revise with AI" side chat and "Regenerate this slide"
- The team roll-up summary and the weekly growth note are still sample text, since there's no database to collect everyone's check-ins.

## Stack

- **Next.js** (static export) hosted on **GitHub Pages**
- **One Supabase Edge Function** (`supabase/functions/ai`) that holds the Claude API key and calls the **Claude API**. GitHub Pages can't keep secrets, so the key never goes in the site.

| AI job | Model |
|---|---|
| Check-in summary | Claude Haiku 5.5 |
| Topics, subtopics, slide revisions, YouTube search | Claude Sonnet 5.5 |
| Slide deck | Claude Opus 5.5 |

## App passcode

Anyone could call the function's public address, so it only runs when the request carries the shared app passcode. The first time an AI step runs, the app asks for it and the browser remembers it (change or forget it in Team settings). Get the passcode from the team; never commit it.

Set a monthly spend limit in the Anthropic Console as a backstop.

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000. The local site calls the deployed function (localhost is allowed).

## Deploy

- **Site:** every push to `main` builds the site and deploys it to GitHub Pages via `.github/workflows/deploy.yml`.
- **AI function:** deployed by hand from a computer that has access to the Supabase project:

  ```bash
  npx supabase login
  npx supabase link --project-ref rpiwqnrqywqoiluimtwk
  npx supabase functions deploy ai --no-verify-jwt
  ```

  Secrets (set once; values never go in the repo):

  ```bash
  npx supabase secrets set ANTHROPIC_API_KEY=... APP_PASSCODE=...
  ```

  The function only accepts requests from `https://whitstir.github.io` and `localhost:3000`. If the site moves, update `ALLOWED_ORIGINS` in `supabase/functions/ai/index.ts`.
