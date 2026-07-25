import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import catalogHandler from "../api/catalog.js";

const originalFetch = globalThis.fetch;
const originalToken = process.env.TMDB_TOKEN;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockMovie(id = 1) {
  return {
    id,
    title: `Movie ${id}`,
    overview: "A Reevu test movie.",
    poster_path: null,
    backdrop_path: null,
    release_date: "2026-01-01",
    vote_average: 8,
  };
}

before(() => {
  process.env.TMDB_TOKEN = "test-token";
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));

    if (url.pathname.endsWith("/credits")) {
      return jsonResponse({ cast: [], crew: [] });
    }
    if (url.pathname.endsWith("/videos")) {
      return jsonResponse({ results: [] });
    }
    if (url.pathname.endsWith("/recommendations")) {
      return jsonResponse({ results: [mockMovie(2)] });
    }
    if (url.pathname.endsWith("/watch/providers")) {
      return jsonResponse({ results: {} });
    }
    if (url.pathname.endsWith("/movie_credits")) {
      return jsonResponse({ cast: [mockMovie(3)] });
    }
    if (/\/person\/\d+$/.test(url.pathname)) {
      return jsonResponse({
        id: 7,
        name: "Reevu Tester",
        profile_path: null,
      });
    }
    if (/\/movie\/\d+$/.test(url.pathname)) {
      return jsonResponse({
        ...mockMovie(1),
        genres: [],
        runtime: 120,
        tagline: "",
        status: "Released",
        homepage: null,
        budget: 0,
        revenue: 0,
        imdb_id: null,
        production_companies: [],
      });
    }
    if (url.pathname.includes("/search/")) {
      return jsonResponse({
        results: [
          { ...mockMovie(1), media_type: "movie" },
          { id: 4, media_type: "tv", name: "Ignored TV result" },
        ],
      });
    }

    return jsonResponse({
      page: 1,
      results: [mockMovie(1)],
      total_pages: 1,
      total_results: 1,
    });
  };
});

after(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) {
    delete process.env.TMDB_TOKEN;
  } else {
    process.env.TMDB_TOKEN = originalToken;
  }
});

async function runHandler(query) {
  const result = {
    headers: {},
    statusCode: 0,
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.body = value;
    },
  };

  await catalogHandler({ method: "GET", query }, result);
  return result;
}

test("home catalog combines provider sections behind the Reevu API", async () => {
  const result = await runHandler({ resource: "home" });

  assert.equal(result.statusCode, 200);
  assert.equal(result.headers["X-Reevu-Source"], "tmdb-refresh");
  assert.equal(result.body.data.trending.length, 1);
  assert.equal(result.body.data.popular.length, 1);
  assert.equal(result.body.data.topRated.length, 1);
  assert.equal(result.body.data.upcoming.length, 1);
});

test("search filters unsupported media types", async () => {
  const result = await runHandler({
    resource: "search",
    q: "movie",
    page: "1",
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.data.length, 1);
  assert.equal(result.body.data[0].media_type, "movie");
});

test("movie details are composed on the server", async () => {
  const result = await runHandler({ resource: "movie", id: "1" });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.data.movie.title, "Movie 1");
  assert.deepEqual(result.body.data.cast, []);
  assert.equal(result.body.data.recommendations.length, 1);
});

test("invalid resources are rejected without caching the error", async () => {
  const result = await runHandler({ resource: "unknown" });

  assert.equal(result.statusCode, 400);
  assert.equal(result.headers["Cache-Control"], "no-store");
});
