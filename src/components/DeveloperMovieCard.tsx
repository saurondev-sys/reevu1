import { CalendarDays, ChevronRight, Film, Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";

import ImageWithFallback from "@/components/ImageWithFallback";
import { getPosterUrl } from "@/api/tmdb";
import type { DeveloperMovie } from "@/data/developerLibrary";

function formatWatchedDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function DeveloperMovieCard({
  movie,
}: {
  movie: DeveloperMovie;
}) {
  const year = movie.release_date.slice(0, 4);

  return (
    <article className="group min-w-0">
      <Link
        to={`/movie/${movie.id}`}
        className="block"
        aria-label={`View ${movie.title} on Reevu`}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/8 bg-zinc-950 transition duration-300 group-hover:-translate-y-1 group-hover:border-white/20">
          {movie.poster_path ? (
            <ImageWithFallback
              src={getPosterUrl(movie.poster_path)}
              alt={`${movie.title} poster`}
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-950 to-black" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.12),transparent_34%)]" />
              <span className="absolute -bottom-7 -right-2 select-none text-[10rem] font-black leading-none text-white/[0.035]">
                {movie.title.slice(0, 1)}
              </span>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/25" />

          <div className="relative flex h-full flex-col justify-between p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/35 text-zinc-300">
                <Film className="h-5 w-5" />
              </span>
              {movie.liked && (
                <span
                  className="grid h-9 w-9 place-items-center rounded-full border border-red-400/20 bg-red-500/15 text-red-300"
                  title="Developer favorite"
                >
                  <Heart className="h-4 w-4 fill-current" />
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Developer watched
              </p>
              <h3 className="mt-2 text-xl font-bold leading-tight text-white">
                {movie.title}
              </h3>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                <span>{year}</span>
                {movie.developer_rating !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-1 text-zinc-200">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {movie.developer_rating.toFixed(1)}/5
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex min-w-0 items-center gap-1.5 truncate text-sm text-zinc-500">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {formatWatchedDate(movie.watched_date)}
            </p>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-700 transition group-hover:text-zinc-300" />
          </div>
        </div>
      </Link>
    </article>
  );
}
