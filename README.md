# Team Unity App

A web app that helps teams resolve conflict and work on team goals through short, AI-generated trainings approved by a manager. See [docs/specs.md](docs/specs.md) for the product spec.

## Stack

- **Next.js** (static export) hosted on **GitHub Pages**
- **Supabase** for the database, auth, and Edge Functions
- **Claude API** for AI features, called only from Supabase Edge Functions so the API key never reaches the browser

GitHub Pages serves static files only, so anything that needs a secret or a server (AI calls, PowerPoint generation) runs in Supabase Edge Functions.

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy

Every push to `main` builds the site and deploys it to GitHub Pages via `.github/workflows/deploy.yml`.
