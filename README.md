# Reevu

A cinematic movie discovery app built with React, TypeScript, Vite, Tailwind CSS, React Query, and TMDB.

## Features

- Trending, popular, top-rated, and upcoming movie sections
- Live search for movies, actors, and directors
- Movie pages with trailer, cast, reviews, recommendations, and streaming providers
- Actor pages with biography and filmography
- Favorites and watchlist saved in localStorage
- Free authentication options: Google sign-in and email verification codes
- Supabase profiles, ratings, and first-party movie reviews
- Responsive mobile and desktop layout
- Browse pages with pagination
- Loading, empty, error, and 404 states

## Setup

1. Create a TMDB account and obtain a Read Access Token.
2. Copy `.env.example` to `.env`.
3. Replace the placeholder in `.env`:

```env
VITE_TMDB_TOKEN=YOUR_TMDB_READ_ACCESS_TOKEN_HERE
```

4. Install and run:

```bash
npm install
npm run dev
```

## Production note

Vite environment variables are included in the browser bundle. For a public production deployment, proxy TMDB requests through a backend such as FastAPI and store the token as a server-side secret.

## Build

```bash
npm run build
npm run preview
```

Movie data and images are provided by TMDB. Streaming availability is powered by JustWatch through TMDB.
