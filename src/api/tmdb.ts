const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export type MovieCategory = "trending" | "popular" | "top-rated" | "upcoming";

export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  original_language?: string;
  media_type?: "movie";
}

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number | null;
  tagline: string;
  status: string;
  homepage: string | null;
  budget: number;
  revenue: number;
  imdb_id: string | null;
  production_companies: ProductionCompany[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department: string;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface MovieVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface WatchProvider {
  display_priority: number;
  logo_path: string;
  provider_id: number;
  provider_name: string;
}

export interface WatchRegion {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
}

export interface PersonSearchResult {
  id: number;
  media_type: "person";
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for?: Movie[];
}

export type SearchResult = (Movie & { media_type: "movie" }) | PersonSearchResult;

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  homepage: string | null;
  popularity: number;
}

export interface MoviePageData {
  movie: MovieDetails;
  cast: CastMember[];
  crew: CrewMember[];
  videos: MovieVideo[];
  recommendations: Movie[];
  watchProviders: Record<string, WatchRegion>;
}

export interface PersonPageData {
  person: PersonDetails;
  movies: Movie[];
}

export interface HomeMovies {
  trending: Movie[];
  popular: Movie[];
  topRated: Movie[];
  upcoming: Movie[];
}

export interface PaginatedMovies {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

interface CatalogEnvelope<T> {
  data?: T;
  error?: string;
}

async function catalogRequest<T>(
  params: Record<string, string | number>,
): Promise<T> {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
  const response = await fetch(`/api/catalog?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });
  const payload = (await response.json().catch(() => null)) as
    | CatalogEnvelope<T>
    | null;

  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error || "Reevu's movie catalog is unavailable.");
  }

  return payload.data;
}

export async function getHomeMovies(): Promise<HomeMovies> {
  return catalogRequest<HomeMovies>({ resource: "home" });
}

export async function getCategoryMovies(
  category: MovieCategory,
  page = 1,
): Promise<PaginatedMovies> {
  return catalogRequest<PaginatedMovies>({
    resource: "category",
    category,
    page,
  });
}

export async function searchMulti(query: string, page = 1): Promise<SearchResult[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  return catalogRequest<SearchResult[]>({
    resource: "search",
    q: normalizedQuery,
    page,
  });
}

export async function getMoviePageData(movieId: string): Promise<MoviePageData> {
  return catalogRequest<MoviePageData>({ resource: "movie", id: movieId });
}

export async function getPersonPageData(personId: string): Promise<PersonPageData> {
  return catalogRequest<PersonPageData>({ resource: "person", id: personId });
}

export function isMovieCategory(value: string | undefined): value is MovieCategory {
  return ["trending", "popular", "top-rated", "upcoming"].includes(value ?? "");
}

export function getImageUrl(
  path: string | null | undefined,
  size: "w92" | "w185" | "w300" | "w500" | "w780" | "original" = "w500",
): string {
  if (!path) {
    return "";
  }

  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export function getPosterUrl(path: string | null | undefined): string {
  return getImageUrl(path, "w500");
}

export function getBackdropUrl(path: string | null | undefined): string {
  return getImageUrl(path, "original");
}

export function getProfileUrl(path: string | null | undefined): string {
  return getImageUrl(path, "w300");
}

export function getLogoUrl(path: string | null | undefined): string {
  return getImageUrl(path, "w185");
}
