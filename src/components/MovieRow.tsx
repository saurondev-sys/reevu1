import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import type { Movie } from "@/api/tmdb";
import MovieCard from "@/components/MovieCard";

interface MovieRowProps {
  title: string;
  eyebrow?: string;
  movies: Movie[];
  href?: string;
  ranked?: boolean;
}

export function MovieRowSkeleton() {
  return (
    <div className="no-scrollbar flex gap-4 overflow-hidden pb-5 sm:gap-5">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="w-[150px] shrink-0 sm:w-[185px]">
          <div className="aspect-[2/3] animate-pulse rounded-2xl bg-zinc-900" />
          <div className="mt-3 h-5 animate-pulse rounded bg-zinc-900" />
          <div className="mt-2 h-4 w-14 animate-pulse rounded bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}

export default function MovieRow({
  title,
  eyebrow,
  movies,
  href,
  ranked = false,
}: MovieRowProps) {
  if (movies.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-9 sm:px-6 sm:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.26em] text-zinc-500">
              {eyebrow}
            </p>
          )}
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
        </div>

        {href && (
          <Link
            to={href}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-white"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 sm:gap-5">
        {movies.map((movie, index) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            rank={ranked ? index + 1 : undefined}
          />
        ))}
      </div>
    </section>
  );
}
