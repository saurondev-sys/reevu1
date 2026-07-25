# Reevu

A community-led movie discovery app built with React, TypeScript, Vite,
Supabase, Vercel Functions, Tailwind CSS, and React Query.

## Features

- Reevu-owned community charts made from member ratings and reviews
- Account-synced favorites and watchlists with an offline device fallback
- A Supabase catalog cache that survives temporary provider outages
- Trending, popular, top-rated, and upcoming movie sections
- Search for movies, actors, and directors
- Movie pages with trailers, cast, recommendations, and streaming providers
- Google sign-in and email verification through Supabase
- Responsive mobile and desktop layouts

## Setup

1. Create a TMDB account and obtain a Read Access Token.
2. Create a Supabase project.
3. Copy `.env.example` to `.env`.
4. Fill in the browser-safe Supabase values and server-only catalog values:

```env
TMDB_TOKEN=YOUR_TMDB_READ_ACCESS_TOKEN_HERE
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SECRET_KEY
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

5. Run the Supabase scripts described in `AUTH_SETUP.md`.
6. Deploy to Vercel so the `/api/catalog` server function is available.

## Validation

```bash
npm install
npm run lint
npm run build
```

## Reevu-owned platform layer

- The browser reads the Reevu catalog API, not TMDB directly.
- Supabase stores reusable catalog responses and can serve stale data during a
  provider outage.
- Signed-in favorites and watchlists sync to each member's Reevu account.
- Community ratings and reviews power Reevu's own discovery chart.
- TMDB remains a replaceable enrichment source for metadata and media paths.

`TMDB_TOKEN` and `SUPABASE_SECRET_KEY` are server-only. Never prefix either with
`VITE_` in a new deployment, because Vite variables are included in the browser
bundle.

Movie metadata and images are enriched by TMDB. Streaming availability is
powered by JustWatch through TMDB. Reevu member reviews, lists, profiles, and
community rankings are first-party Reevu data.
