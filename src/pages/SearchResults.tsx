import { useQuery } from "@tanstack/react-query";
import { Film, UserRound } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import {
  getProfileUrl,
  searchMulti,
  type Movie,
  type PersonSearchResult,
} from "@/api/tmdb";
import ImageWithFallback from "@/components/ImageWithFallback";
import MovieCard from "@/components/MovieCard";
import SearchBox from "@/components/SearchBox";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const { data: results = [], isLoading, isError } = useQuery({
    queryKey: ["search-page", query],
    queryFn: () => searchMulti(query),
    enabled: query.length >= 2,
  });

  const movies = results.filter(
    (result): result is Movie & { media_type: "movie" } =>
      result.media_type === "movie",
  );
  const people = results.filter(
    (result): result is PersonSearchResult => result.media_type === "person",
  );

  return (
    <main className="min-h-screen bg-[#09090d] pb-20 pt-28 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Search Reevu
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            {query ? `Results for “${query}”` : "Find movies and people"}
          </h1>
          <div className="mt-7">
            <SearchBox variant="page" initialValue={query} />
          </div>
        </div>

        {isLoading && (
          <div className="mt-14 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index}>
                <div className="aspect-[2/3] animate-pulse rounded-2xl bg-zinc-900" />
                <div className="mt-3 h-5 animate-pulse rounded bg-zinc-900" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="mt-12 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            Search failed. Check your TMDB token and try again.
          </div>
        )}

        {!isLoading && !isError && query.length >= 2 && results.length === 0 && (
          <div className="mt-16 rounded-3xl border border-white/8 bg-white/[0.03] p-12 text-center">
            <Film className="mx-auto h-10 w-10 text-zinc-700" />
            <h2 className="mt-5 text-2xl font-bold">No results found</h2>
            <p className="mt-2 text-zinc-500">
              Try a different title, actor, or director name.
            </p>
          </div>
        )}

        {people.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-zinc-500" />
              <h2 className="text-2xl font-bold">People</h2>
            </div>
            <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto pb-5">
              {people.map((person) => (
                <Link
                  key={person.id}
                  to={`/person/${person.id}`}
                  className="group w-[145px] shrink-0"
                >
                  <ImageWithFallback
                    src={getProfileUrl(person.profile_path)}
                    alt={person.name}
                    fallbackType="person"
                    className="aspect-[2/3] w-full rounded-2xl object-cover ring-1 ring-white/8 transition group-hover:-translate-y-1 group-hover:ring-white/20"
                  />
                  <h3 className="mt-3 truncate font-semibold">{person.name}</h3>
                  <p className="mt-1 truncate text-sm text-zinc-500">
                    {person.known_for_department || "Person"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {movies.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center gap-3">
              <Film className="h-5 w-5 text-zinc-500" />
              <h2 className="text-2xl font-bold">Movies</h2>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} layout="grid" />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
