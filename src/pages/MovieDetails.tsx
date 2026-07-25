import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Clock3,
  ExternalLink,
  Heart,
  Play,
  Star,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import {
  getBackdropUrl,
  getLogoUrl,
  getMoviePageData,
  getPosterUrl,
  getProfileUrl,
  type MovieVideo,
  type WatchProvider,
} from "@/api/tmdb";
import ImageWithFallback from "@/components/ImageWithFallback";
import MovieRow from "@/components/MovieRow";
import { PageError, PageLoader } from "@/components/PageState";
import ReviewSection from "@/components/ReviewSection";
import TrailerModal from "@/components/TrailerModal";
import { useLibrary } from "@/context/LibraryContext";

const regions = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
];

function findTrailer(videos: MovieVideo[]): MovieVideo | undefined {
  return (
    videos.find(
      (video) =>
        video.site === "YouTube" &&
        video.type === "Trailer" &&
        video.official,
    ) ??
    videos.find(
      (video) => video.site === "YouTube" && video.type === "Trailer",
    ) ??
    videos.find((video) => video.site === "YouTube")
  );
}

function formatRuntime(runtime: number | null): string {
  if (!runtime) {
    return "Runtime unavailable";
  }

  const hours = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatMoney(value: number): string {
  if (!value) {
    return "Not reported";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function ProviderGroup({
  title,
  providers,
}: {
  title: string;
  providers?: WatchProvider[];
}) {
  if (!providers?.length) {
    return null;
  }

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {title}
      </p>
      <div className="flex flex-wrap gap-3">
        {providers.map((provider) => (
          <div
            key={`${title}-${provider.provider_id}`}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 pr-3"
            title={provider.provider_name}
          >
            <ImageWithFallback
              src={getLogoUrl(provider.logo_path)}
              alt={provider.provider_name}
              className="h-10 w-10 rounded-lg object-cover"
            />
            <span className="max-w-32 truncate text-sm text-zinc-300">
              {provider.provider_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MovieDetails() {
  const { movieId } = useParams();
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [region, setRegion] = useState("IN");
  const { toggleFavorite, toggleWatchlist, isFavorite, isInWatchlist } =
    useLibrary();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["movie-page", movieId],
    queryFn: () => getMoviePageData(movieId!),
    enabled: Boolean(movieId),
  });

  const trailer = useMemo(
    () => (data ? findTrailer(data.videos) : undefined),
    [data],
  );

  if (isLoading) {
    return <PageLoader label="Loading movie details..." />;
  }

  if (isError || !data) {
    return <PageError title="Could not load this movie" />;
  }

  const { movie, cast, crew, recommendations, watchProviders } = data;
  const director = crew.find((member) => member.job === "Director");
  const selectedProviders = watchProviders[region];
  const favorite = isFavorite(movie.id);
  const inWatchlist = isInWatchlist(movie.id);

  return (
    <main className="min-h-screen bg-[#09090d] pb-16 pt-16 text-white">
      <section className="relative min-h-[82vh] overflow-hidden">
        {movie.backdrop_path && (
          <div className="absolute inset-0">
            <img
              src={getBackdropUrl(movie.backdrop_path)}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090d] via-[#09090d]/75 to-[#09090d]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090d] via-transparent to-black/35" />
          </div>
        )}

        <div className="relative mx-auto flex min-h-[82vh] max-w-7xl flex-col px-5 py-8 sm:px-6">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-300 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="mt-auto grid items-end gap-8 pb-8 pt-16 md:grid-cols-[250px_1fr] lg:grid-cols-[290px_1fr] lg:gap-12">
            <ImageWithFallback
              src={getPosterUrl(movie.poster_path)}
              alt={`${movie.title} poster`}
              className="aspect-[2/3] w-full max-w-[290px] rounded-3xl object-cover shadow-2xl ring-1 ring-white/10"
            />

            <div className="max-w-4xl">
              {movie.tagline && (
                <p className="mb-4 text-lg italic text-zinc-300">
                  “{movie.tagline}”
                </p>
              )}

              <h1 className="text-5xl font-black leading-none tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                {movie.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-zinc-300">
                <span className="inline-flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  {movie.vote_average.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {movie.release_date?.slice(0, 4) || "TBA"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-5 w-5" />
                  {formatRuntime(movie.runtime)}
                </span>
                {director && <span>Directed by {director.name}</span>}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm text-zinc-200 backdrop-blur-md"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>

              <p className="mt-7 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
                {movie.overview || "No overview is available for this movie."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {trailer && (
                  <button
                    type="button"
                    onClick={() => setTrailerOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:scale-[1.02] hover:bg-zinc-200"
                  >
                    <Play className="h-5 w-5 fill-black" />
                    Watch trailer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleFavorite(movie)}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 font-semibold backdrop-blur-md transition ${
                    favorite
                      ? "border-red-400/30 bg-red-500/20 text-red-100"
                      : "border-white/15 bg-black/25 text-white hover:bg-white/10"
                  }`}
                >
                  <Heart className={`h-5 w-5 ${favorite ? "fill-current" : ""}`} />
                  {favorite ? "Favorited" : "Favorite"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleWatchlist(movie)}
                  className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 font-semibold backdrop-blur-md transition ${
                    inWatchlist
                      ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                      : "border-white/15 bg-black/25 text-white hover:bg-white/10"
                  }`}
                >
                  <Bookmark
                    className={`h-5 w-5 ${inWatchlist ? "fill-current" : ""}`}
                  />
                  {inWatchlist ? "In watchlist" : "Watchlist"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <section className="py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-500">
            Featuring
          </p>
          <h2 className="mt-2 text-3xl font-bold">Top Cast</h2>

          <div className="no-scrollbar mt-7 flex snap-x gap-4 overflow-x-auto pb-5 sm:gap-5">
            {cast.map((person) => (
              <Link
                key={person.id}
                to={`/person/${person.id}`}
                className="group w-[135px] shrink-0 snap-start sm:w-[155px]"
              >
                <ImageWithFallback
                  src={getProfileUrl(person.profile_path)}
                  alt={person.name}
                  fallbackType="person"
                  className="aspect-[2/3] w-full rounded-2xl object-cover ring-1 ring-white/8 transition group-hover:-translate-y-1 group-hover:ring-white/20"
                  loading="lazy"
                />
                <h3 className="mt-3 truncate font-semibold text-zinc-100">
                  {person.name}
                </h3>
                <p className="mt-1 truncate text-sm text-zinc-500">
                  {person.character || "Cast"}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-6 py-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/8 bg-white/[0.035] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  Streaming availability
                </p>
                <h2 className="mt-2 text-2xl font-bold">Where to watch</h2>
              </div>
              <select
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 outline-none"
                aria-label="Select watch region"
              >
                {regions.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedProviders ? (
              <div className="mt-7 space-y-7">
                <ProviderGroup
                  title="Stream"
                  providers={selectedProviders.flatrate}
                />
                <ProviderGroup title="Free" providers={selectedProviders.free} />
                <ProviderGroup title="With ads" providers={selectedProviders.ads} />
                <ProviderGroup title="Rent" providers={selectedProviders.rent} />
                <ProviderGroup title="Buy" providers={selectedProviders.buy} />
                <a
                  href={selectedProviders.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white"
                >
                  View availability on TMDB
                  <ExternalLink className="h-4 w-4" />
                </a>
                <p className="text-xs text-zinc-600">Streaming data powered by JustWatch.</p>
              </div>
            ) : (
              <p className="mt-7 text-zinc-500">
                No streaming information is currently available for this region.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/8 bg-white/[0.035] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Movie details
            </p>
            <h2 className="mt-2 text-2xl font-bold">Facts</h2>
            <dl className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <dt className="text-sm text-zinc-600">Status</dt>
                <dd className="mt-1 font-medium text-zinc-200">{movie.status}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-600">Original language</dt>
                <dd className="mt-1 font-medium uppercase text-zinc-200">
                  {movie.original_language || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-600">Budget</dt>
                <dd className="mt-1 font-medium text-zinc-200">
                  {formatMoney(movie.budget)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-600">Revenue</dt>
                <dd className="mt-1 font-medium text-zinc-200">
                  {formatMoney(movie.revenue)}
                </dd>
              </div>
            </dl>

            {movie.production_companies.length > 0 && (
              <div className="mt-7 border-t border-white/8 pt-6">
                <p className="text-sm text-zinc-600">Production</p>
                <p className="mt-2 leading-7 text-zinc-300">
                  {movie.production_companies
                    .slice(0, 4)
                    .map((company) => company.name)
                    .join(" · ")}
                </p>
              </div>
            )}
          </div>
        </section>

        <ReviewSection movie={movie} />
      </div>

      <MovieRow
        title="You may also like"
        eyebrow="Recommended next"
        movies={recommendations}
      />

      <TrailerModal
        videoKey={trailerOpen ? trailer?.key ?? null : null}
        title={movie.title}
        onClose={() => setTrailerOpen(false)}
      />
    </main>
  );
}
