import { useInfiniteQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useParams } from "react-router-dom";

import {
  getCategoryMovies,
  isMovieCategory,
  type MovieCategory,
} from "@/api/tmdb";
import MovieCard from "@/components/MovieCard";
import { PageError } from "@/components/PageState";
import NotFound from "@/pages/NotFound";

const categoryCopy: Record<
  MovieCategory,
  { title: string; eyebrow: string; description: string }
> = {
  trending: {
    title: "Trending Movies",
    eyebrow: "This week",
    description: "The movies attracting the most attention right now.",
  },
  popular: {
    title: "Popular Movies",
    eyebrow: "Crowd favorites",
    description: "The most popular movies currently being explored on Reevu.",
  },
  "top-rated": {
    title: "Top Rated Movies",
    eyebrow: "All-time greats",
    description: "Highly rated movies loved by audiences around the world.",
  },
  upcoming: {
    title: "Upcoming Movies",
    eyebrow: "Coming soon",
    description: "Upcoming releases worth adding to your watchlist.",
  },
};

function BrowseCategory({ category }: { category: MovieCategory }) {
  const copy = categoryCopy[category];
  const query = useInfiniteQuery({
    queryKey: ["browse", category],
    queryFn: ({ pageParam }) => getCategoryMovies(category, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < Math.min(lastPage.total_pages, 20)
        ? lastPage.page + 1
        : undefined,
  });

  if (query.isError) {
    return <PageError title="Could not load these movies" />;
  }

  const movies = query.data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <main className="min-h-screen bg-[#09090d] pb-20 pt-28 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
          {copy.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] sm:text-6xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-500">
          {copy.description}
        </p>

        {query.isLoading ? (
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 18 }).map((_, index) => (
              <div key={index}>
                <div className="aspect-[2/3] animate-pulse rounded-2xl bg-zinc-900" />
                <div className="mt-3 h-5 animate-pulse rounded bg-zinc-900" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((movie, index) => (
              <MovieCard
                key={`${movie.id}-${index}`}
                movie={movie}
                layout="grid"
              />
            ))}
          </div>
        )}

        {query.hasNextPage && (
          <div className="mt-14 text-center">
            <button
              type="button"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {query.isFetchingNextPage && (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              )}
              {query.isFetchingNextPage ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Browse() {
  const { category } = useParams();

  if (!isMovieCategory(category)) {
    return <NotFound />;
  }

  return <BrowseCategory category={category} />;
}
