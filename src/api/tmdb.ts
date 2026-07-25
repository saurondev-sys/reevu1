import axios from "axios";

const IS_PRODUCTION = import.meta.env.PROD;
const TMDB_BASE_URL = IS_PRODUCTION
  ? "/api/movies"
  : "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const TMDB_TOKEN = import.meta.env.VITE_TMDB_TOKEN as string | undefined;

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

interface MultiSearchResponse {
  page: number;
  results: Array<SearchResult | { id: number; media_type: "tv" }>;
  total_pages: number;
  total_results: number;
}

interface CreditsResponse {
  cast: CastMember[];
  crew: CrewMember[];
}

interface VideosResponse {
  results: MovieVideo[];
}

interface RecommendationsResponse {
  results: Movie[];
}

interface WatchProvidersResponse {
  results: Record<string, WatchRegion>;
}

interface PersonMovieCreditsResponse {
  cast: Movie[];
}

export const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    ...(!IS_PRODUCTION && {
      Authorization: `Bearer ${TMDB_TOKEN ?? ""}`,
    }),
    Accept: "application/json",
  },
});

if (IS_PRODUCTION) {
  tmdbApi.interceptors.request.use((config) => {
    const path = config.url ?? "";

    config.url = "";
    config.params = {
      ...config.params,
      path,
    };

    return config;
  });
}

function apiParams(extra: Record<string, string | number | boolean> = {}) {
  return {
    language: "en-US",
    include_adult: false,
    ...extra,
  };
}

export function hasTmdbToken(): boolean {
  return (
    IS_PRODUCTION ||
    Boolean(TMDB_TOKEN && TMDB_TOKEN !== "YOUR_TMDB_READ_ACCESS_TOKEN_HERE")
  );
}

export async function getHomeMovies(): Promise<HomeMovies> {
  const [trending, popular, topRated, upcoming] = await Promise.all([
    tmdbApi.get<PaginatedMovies>("/trending/movie/week", {
      params: apiParams(),
    }),
    tmdbApi.get<PaginatedMovies>("/movie/popular", {
      params: apiParams({ region: "IN" }),
    }),
    tmdbApi.get<PaginatedMovies>("/movie/top_rated", {
      params: apiParams({ region: "IN" }),
    }),
    tmdbApi.get<PaginatedMovies>("/movie/upcoming", {
      params: apiParams({ region: "IN" }),
    }),
  ]);

  return {
    trending: trending.data.results,
    popular: popular.data.results,
    topRated: topRated.data.results,
    upcoming: upcoming.data.results,
  };
}

export async function getCategoryMovies(
  category: MovieCategory,
  page = 1,
): Promise<PaginatedMovies> {
  const endpoint: Record<MovieCategory, string> = {
    trending: "/trending/movie/week",
    popular: "/movie/popular",
    "top-rated": "/movie/top_rated",
    upcoming: "/movie/upcoming",
  };

  const response = await tmdbApi.get<PaginatedMovies>(endpoint[category], {
    params: apiParams({ page, region: "IN" }),
  });

  return response.data;
}

export async function searchMulti(query: string, page = 1): Promise<SearchResult[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const response = await tmdbApi.get<MultiSearchResponse>("/search/multi", {
    params: apiParams({ query: normalizedQuery, page }),
  });

  return response.data.results.filter(
    (result): result is SearchResult =>
      result.media_type === "movie" || result.media_type === "person",
  );
}

export async function getMoviePageData(movieId: string): Promise<MoviePageData> {
  const [movie, credits, videos, recommendations, watchProviders] =
    await Promise.all([
      tmdbApi.get<MovieDetails>(`/movie/${movieId}`, {
        params: apiParams(),
      }),
      tmdbApi.get<CreditsResponse>(`/movie/${movieId}/credits`, {
        params: apiParams(),
      }),
      tmdbApi.get<VideosResponse>(`/movie/${movieId}/videos`, {
        params: apiParams(),
      }),
      tmdbApi.get<RecommendationsResponse>(`/movie/${movieId}/recommendations`, {
        params: apiParams(),
      }),
      tmdbApi.get<WatchProvidersResponse>(`/movie/${movieId}/watch/providers`),
    ]);

  return {
    movie: movie.data,
    cast: credits.data.cast.slice(0, 18),
    crew: credits.data.crew,
    videos: videos.data.results,
    recommendations: recommendations.data.results.slice(0, 16),
    watchProviders: watchProviders.data.results,
  };
}

export async function getPersonPageData(personId: string): Promise<PersonPageData> {
  const [person, credits] = await Promise.all([
    tmdbApi.get<PersonDetails>(`/person/${personId}`, {
      params: apiParams(),
    }),
    tmdbApi.get<PersonMovieCreditsResponse>(`/person/${personId}/movie_credits`, {
      params: apiParams(),
    }),
  ]);

  const uniqueMovies = Array.from(
    new Map(credits.data.cast.map((movie) => [movie.id, movie])).values(),
  )
    .filter((movie) => movie.poster_path)
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

  return {
    person: person.data,
    movies: uniqueMovies.slice(0, 30),
  };
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
