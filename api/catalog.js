import { GET } from "../server/catalog.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  const protocol = request.headers["x-forwarded-proto"] || "https";
  const host = request.headers.host || "localhost";
  const result = await GET({
    url: new URL(request.url || "/", `${protocol}://${host}`).toString(),
  });

  response.status(result.status);
  for (const [name, value] of result.headers.entries()) {
    response.setHeader(name, value);
  }
  response.send(Buffer.from(await result.arrayBuffer()));
}
