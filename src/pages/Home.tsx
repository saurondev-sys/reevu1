import { useQuery } from "@tanstack/react-query";
import { BookmarkPlus, Info, Sparkles, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import {
  getBackdropUrl,
  getHomeMovies,
  hasTmdbToken,
} from "@/api/tmdb";
import MovieRow, { MovieRowSkeleton } from "@/components/MovieRow";
import SearchBox from "@/components/SearchBox";
import { useLibrary } from "@/context/LibraryContext";

export default function Home() {
  const { toggleWatchlist, isInWatchlist } = useLibrary();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home-movies"],
    queryFn: getHomeMovies,
  });

  const featured = data?.trending[0];

  return (
    <main className="min-h-screen bg-[#09090d] text-white">
      <section className="relative min-h-[88vh] overflow-hidden pt-16">
        {featured?.backdrop_path && (
          <div className="absolute inset-0">
            <img
              src={getBackdropUrl(featured.backdrop_path)}
              alt=""
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#09090d] via-[#09090d]/75 to-[#09090d]/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090d] via-transparent to-black/25" />
          </div>
        )}

        <div className="relative mx-auto flex min-h-[calc(88vh-4rem)] max-w-7xl items-center px-5 py-16 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Trending this week
            </div>

            <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
              {featured?.title ?? "Discover your next favorite movie."}
            </h1>

            {featured && (
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-300 sm:text-base">
                <span>{featured.release_date?.slice(0, 4) || "Coming soon"}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-500" />
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {featured.vote_average.toFixed(1)}
                </span>
              </div>
            )}

            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
              {featured?.overview ||
                "Search movies, explore cast and trailers, check where to watch, and build your personal watchlist."}
            </p>

            {featured && (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={`/movie/${featured.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:scale-[1.02] hover:bg-zinc-200"
                >
                  <Info className="h-5 w-5" />
                  View details
                </Link>
                <button
                  type="button"
                  onClick={() => toggleWatchlist(featured)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-6 py-3 font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
                >
                  <BookmarkPlus className="h-5 w-5" />
                  {isInWatchlist(featured.id) ? "In watchlist" : "Add to watchlist"}
                </button>
              </div>
            )}

            <div className="mt-10 w-full max-w-2xl">
              <SearchBox variant="hero" />
            </div>
          </motion.div>
        </div>
      </section>

      {!hasTmdbToken() && (
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
            Add your TMDB Read Access Token to <code>.env</code> as
            <code className="ml-1">VITE_TMDB_TOKEN</code>, then restart Vite.
          </div>
        </div>
      )}

      {isError && (
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Reevu could not reach TMDB. Check the token in your <code>.env</code>
            file and restart the development server.
          </div>
        </div>
      )}

      {isLoading && (
        <div className="mx-auto max-w-7xl space-y-14 px-5 py-12 sm:px-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <div className="mb-6 h-8 w-52 animate-pulse rounded bg-zinc-900" />
              <MovieRowSkeleton />
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="pb-12">
          <MovieRow
            title="Trending Now"
            eyebrow="This week"
            movies={data.trending.slice(0, 16)}
            href="/browse/trending"
            ranked
          />
          <MovieRow
            title="Popular in India"
            eyebrow="What everyone is watching"
            movies={data.popular.slice(0, 16)}
            href="/browse/popular"
          />
          <MovieRow
            title="Top Rated"
            eyebrow="All-time favorites"
            movies={data.topRated.slice(0, 16)}
            href="/browse/top-rated"
          />
          <MovieRow
            title="Coming Soon"
            eyebrow="Mark your calendar"
            movies={data.upcoming.slice(0, 16)}
            href="/browse/upcoming"
          />
        </div>
      )}
    </main>
  );
}
