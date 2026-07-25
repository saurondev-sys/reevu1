const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const cacheTtl = {
  home: 60 * 60 * 6,
  category: 60 * 60 * 6,
  search: 60 * 30,
  movie: 60 * 60 * 24 * 7,
  person: 60 * 60 * 24 * 7,
};

function env(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

function send(response, status, body, source = "reevu") {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader(
    "Cache-Control",
    status === 200
      ? "public, s-maxage=300, stale-while-revalidate=86400"
      : "no-store",
  );
  response.setHeader("X-Reevu-Source", source);
  response.status(status).json(body);
}

function tmdbParams(extra = {}) {
  return {
    language: "en-US",
    include_adult: "false",
    ...extra,
  };
}

async function fetchTmdb(path, params = {}) {
  const token = env("TMDB_TOKEN", "VITE_TMDB_TOKEN");
  if (!token) {
    throw new Error("TMDB is not configured on the server.");
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Movie provider returned HTTP ${response.status}.`);
  }

  return response.json();
}

function supabaseConfig() {
  return {
    url: env("SUPABASE_URL", "VITE_SUPABASE_URL"),
    publicKey: env(
      "SUPABASE_ANON_KEY",
      "SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_ANON_KEY",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
    ),
    secretKey: env("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
  };
}

async function readCache(cacheKey) {
  const { url, publicKey, secretKey } = supabaseConfig();
  const key = secretKey || publicKey;
  if (!url || !key) return null;

  const endpoint = new URL(`${url}/rest/v1/reevu_catalog_cache`);
  endpoint.searchParams.set("cache_key", `eq.${cacheKey}`);
  endpoint.searchParams.set("select", "payload,expires_at,source_updated_at");
  endpoint.searchParams.set("limit", "1");

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });
    if (!response.ok) return null;

    const rows = await response.json();
    const row = rows[0];
    if (!row) return null;

    return {
      data: row.payload,
      fresh: Date.parse(row.expires_at) > Date.now(),
      updatedAt: row.source_updated_at,
    };
  } catch {
    return null;
  }
}

async function writeCache(cacheKey, resource, data, ttlSeconds) {
  const { url, secretKey } = supabaseConfig();
  if (!url || !secretKey) return;

  const now = new Date();
  const endpoint = new URL(`${url}/rest/v1/reevu_catalog_cache`);
  endpoint.searchParams.set("on_conflict", "cache_key");

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        cache_key: cacheKey,
        resource,
        payload: data,
        source: "tmdb",
        source_updated_at: now.toISOString(),
        expires_at: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
        updated_at: now.toISOString(),
      }),
    });
  } catch {
    // A cache write must never make the user-facing request fail.
  }
}

function categoryPath(category) {
  return {
    trending: "/trending/movie/week",
    popular: "/movie/popular",
    "top-rated": "/movie/top_rated",
    upcoming: "/movie/upcoming",
  }[category];
}

async function loadResource(resource, query) {
  if (resource === "home") {
    const [trending, popular, topRated, upcoming] = await Promise.all([
      fetchTmdb("/trending/movie/week", tmdbParams()),
      fetchTmdb("/movie/popular", tmdbParams({ region: "IN" })),
      fetchTmdb("/movie/top_rated", tmdbParams({ region: "IN" })),
      fetchTmdb("/movie/upcoming", tmdbParams({ region: "IN" })),
    ]);
    return {
      trending: trending.results,
      popular: popular.results,
      topRated: topRated.results,
      upcoming: upcoming.results,
    };
  }

  if (resource === "category") {
    const category = String(query.category || "");
    const endpoint = categoryPath(category);
    if (!endpoint) throw new Error("Unknown movie category.");
    const page = Math.max(1, Math.min(Number(query.page) || 1, 500));
    return fetchTmdb(endpoint, tmdbParams({ page, region: "IN" }));
  }

  if (resource === "search") {
    const searchQuery = String(query.q || "").trim().slice(0, 120);
    if (searchQuery.length < 2) return [];
    const page = Math.max(1, Math.min(Number(query.page) || 1, 500));
    const response = await fetchTmdb(
      "/search/multi",
      tmdbParams({ query: searchQuery, page }),
    );
    return response.results.filter(
      (result) => result.media_type === "movie" || result.media_type === "person",
    );
  }

  if (resource === "movie") {
    const movieId = String(query.id || "");
    if (!/^\d+$/.test(movieId)) throw new Error("Invalid movie ID.");
    const [movie, credits, videos, recommendations, watchProviders] =
      await Promise.all([
        fetchTmdb(`/movie/${movieId}`, tmdbParams()),
        fetchTmdb(`/movie/${movieId}/credits`, tmdbParams()),
        fetchTmdb(`/movie/${movieId}/videos`, tmdbParams()),
        fetchTmdb(`/movie/${movieId}/recommendations`, tmdbParams()),
        fetchTmdb(`/movie/${movieId}/watch/providers`),
      ]);
    return {
      movie,
      cast: credits.cast.slice(0, 18),
      crew: credits.crew,
      videos: videos.results,
      recommendations: recommendations.results.slice(0, 16),
      watchProviders: watchProviders.results,
    };
  }

  if (resource === "person") {
    const personId = String(query.id || "");
    if (!/^\d+$/.test(personId)) throw new Error("Invalid person ID.");
    const [person, credits] = await Promise.all([
      fetchTmdb(`/person/${personId}`, tmdbParams()),
      fetchTmdb(`/person/${personId}/movie_credits`, tmdbParams()),
    ]);
    const uniqueMovies = Array.from(
      new Map(credits.cast.map((movie) => [movie.id, movie])).values(),
    )
      .filter((movie) => movie.poster_path)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 30);
    return { person, movies: uniqueMovies };
  }

  throw new Error("Unknown Reevu catalog resource.");
}

function cacheKeyFor(resource, query) {
  if (resource === "category") {
    return `category:${query.category || ""}:${Number(query.page) || 1}`;
  }
  if (resource === "search") {
    return `search:${String(query.q || "").trim().toLowerCase()}:${Number(query.page) || 1}`;
  }
  if (resource === "movie" || resource === "person") {
    return `${resource}:${query.id || ""}`;
  }
  return resource;
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return send(response, 405, { error: "Only GET requests are supported." });
  }

  const resource = String(request.query.resource || "");
  if (!Object.hasOwn(cacheTtl, resource)) {
    return send(response, 400, { error: "Invalid catalog resource." });
  }

  const cacheKey = cacheKeyFor(resource, request.query);
  const cached = await readCache(cacheKey);
  if (cached?.fresh) {
    return send(
      response,
      200,
      { data: cached.data, cachedAt: cached.updatedAt },
      "reevu-cache",
    );
  }

  try {
    const data = await loadResource(resource, request.query);
    await writeCache(cacheKey, resource, data, cacheTtl[resource]);
    return send(response, 200, { data }, "tmdb-refresh");
  } catch (error) {
    if (cached) {
      return send(
        response,
        200,
        { data: cached.data, cachedAt: cached.updatedAt, stale: true },
        "reevu-stale-cache",
      );
    }

    const message =
      error instanceof Error ? error.message : "The catalog could not be loaded.";
    return send(response, 502, { error: message });
  }
}
