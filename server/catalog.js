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

function json(status, body, source = "reevu") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control":
        status === 200
          ? "public, s-maxage=300, stale-while-revalidate=86400"
          : "no-store",
      "X-Reevu-Source": source,
    },
  });
}

function tmdbParams(extra = {}) {
  return { language: "en-US", include_adult: "false", ...extra };
}

async function fetchTmdb(path, params = {}) {
  const token = env("TMDB_TOKEN", "VITE_TMDB_TOKEN");
  if (!token) throw new Error("TMDB is not configured on the server.");

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
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
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) return null;
    const [row] = await response.json();
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
    // Cache failures should never break a user request.
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
    const category = query.get("category") || "";
    const endpoint = categoryPath(category);
    if (!endpoint) throw new Error("Unknown movie category.");
    const page = Math.max(1, Math.min(Number(query.get("page")) || 1, 500));
    return fetchTmdb(endpoint, tmdbParams({ page, region: "IN" }));
  }

  if (resource === "search") {
    const searchQuery = (query.get("q") || "").trim().slice(0, 120);
    if (searchQuery.length < 2) return [];
    const page = Math.max(1, Math.min(Number(query.get("page")) || 1, 500));
    const result = await fetchTmdb(
      "/search/multi",
      tmdbParams({ query: searchQuery, page }),
    );
    return result.results.filter(
      (item) => item.media_type === "movie" || item.media_type === "person",
    );
  }

  if (resource === "movie") {
    const movieId = query.get("id") || "";
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
    const personId = query.get("id") || "";
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
    return `category:${query.get("category") || ""}:${Number(query.get("page")) || 1}`;
  }
  if (resource === "search") {
    return `search:${(query.get("q") || "").trim().toLowerCase()}:${Number(query.get("page")) || 1}`;
  }
  if (resource === "movie" || resource === "person") {
    return `${resource}:${query.get("id") || ""}`;
  }
  return resource;
}

export async function GET(request) {
  const query = new URL(request.url).searchParams;
  const resource = query.get("resource") || "";
  if (!Object.hasOwn(cacheTtl, resource)) {
    return json(400, { error: "Invalid catalog resource." });
  }

  const cacheKey = cacheKeyFor(resource, query);
  const cached = await readCache(cacheKey);
  if (cached?.fresh) {
    return json(
      200,
      { data: cached.data, cachedAt: cached.updatedAt },
      "reevu-cache",
    );
  }

  try {
    const data = await loadResource(resource, query);
    await writeCache(cacheKey, resource, data, cacheTtl[resource]);
    return json(200, { data }, "tmdb-refresh");
  } catch (error) {
    if (cached) {
      return json(
        200,
        { data: cached.data, cachedAt: cached.updatedAt, stale: true },
        "reevu-stale-cache",
      );
    }
    return json(502, {
      error:
        error instanceof Error
          ? error.message
          : "The catalog could not be loaded.",
    });
  }
}
