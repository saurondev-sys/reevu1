const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const ALLOWED_PATH = /^\/[a-zA-Z0-9/_-]+$/;

function getSingleQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const path = getSingleQueryValue(request.query.path);

  if (typeof path !== "string" || !ALLOWED_PATH.test(path)) {
    return response.status(400).json({ error: "Invalid TMDB path" });
  }

  const token =
    process.env.TMDB_TOKEN?.trim() ||
    process.env.VITE_TMDB_TOKEN?.trim();

  if (!token) {
    return response.status(500).json({ error: "TMDB token is not configured" });
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(request.query)) {
    if (key === "path" || value === undefined) {
      continue;
    }

    for (const entry of Array.isArray(value) ? value : [value]) {
      searchParams.append(key, String(entry));
    }
  }

  const query = searchParams.toString();
  const upstreamUrl = `${TMDB_BASE_URL}${path}${query ? `?${query}` : ""}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const body = await upstreamResponse.text();
    const contentType = upstreamResponse.headers.get("content-type");

    if (contentType) {
      response.setHeader("Content-Type", contentType);
    }

    response.setHeader(
      "Cache-Control",
      "s-maxage=300, stale-while-revalidate=600",
    );

    return response.status(upstreamResponse.status).send(body);
  } catch {
    return response.status(502).json({ error: "TMDB request failed" });
  }
}
