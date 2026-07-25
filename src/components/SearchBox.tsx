import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Film, LoaderCircle, Search, UserRound, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getPosterUrl,
  getProfileUrl,
  searchMulti,
  type SearchResult,
} from "@/api/tmdb";
import { useDebounce } from "@/hooks/useDebounce";
import ImageWithFallback from "@/components/ImageWithFallback";

interface SearchBoxProps {
  variant?: "hero" | "header" | "page";
  initialValue?: string;
}

function resultTitle(result: SearchResult): string {
  return result.media_type === "movie" ? result.title : result.name;
}

function resultSubtitle(result: SearchResult): string {
  if (result.media_type === "person") {
    return result.known_for_department || "Person";
  }

  const year = result.release_date?.slice(0, 4);
  return year ? `Movie · ${year}` : "Movie";
}

export default function SearchBox({
  variant = "header",
  initialValue = "",
}: SearchBoxProps) {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query.trim());

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["search-suggestions", debouncedQuery],
    queryFn: () => searchMulti(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();

    if (!value) {
      return;
    }

    setOpen(false);
    navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  const openResult = (result: SearchResult) => {
    setOpen(false);
    setQuery(resultTitle(result));
    navigate(
      result.media_type === "movie"
        ? `/movie/${result.id}`
        : `/person/${result.id}`,
    );
  };

  const sizing = {
    hero: "h-16 rounded-full pl-14 pr-14 text-base shadow-2xl",
    header: "h-10 rounded-full pl-10 pr-10 text-sm",
    page: "h-14 rounded-2xl pl-12 pr-12 text-base",
  }[variant];

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={submitSearch} role="search">
        <Search
          className={`absolute top-1/2 z-10 -translate-y-1/2 text-zinc-500 ${
            variant === "header" ? "left-3 h-4 w-4" : "left-5 h-5 w-5"
          }`}
        />

        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search movies, actors, directors..."
          aria-label="Search movies and people"
          className={`w-full border border-white/10 bg-zinc-950/80 text-white outline-none backdrop-blur-xl transition placeholder:text-zinc-600 focus:border-white/25 focus:ring-4 focus:ring-white/5 ${sizing}`}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            aria-label="Clear search"
            className={`absolute top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-500 transition hover:bg-white/10 hover:text-white ${
              variant === "header" ? "right-2" : "right-4"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {open && debouncedQuery.length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.65rem)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-2xl">
          {isFetching && (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-zinc-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Searching Reevu...
            </div>
          )}

          {!isFetching && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              No matches found for “{debouncedQuery}”.
            </div>
          )}

          {!isFetching &&
            results.slice(0, 7).map((result) => {
              const image =
                result.media_type === "movie"
                  ? getPosterUrl(result.poster_path)
                  : getProfileUrl(result.profile_path);

              return (
                <button
                  key={`${result.media_type}-${result.id}`}
                  type="button"
                  onClick={() => openResult(result)}
                  className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/8"
                >
                  <ImageWithFallback
                    src={image}
                    alt={resultTitle(result)}
                    fallbackType={
                      result.media_type === "movie" ? "poster" : "person"
                    }
                    className="h-14 w-10 shrink-0 rounded-lg object-cover"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-zinc-100">
                      {resultTitle(result)}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                      {result.media_type === "movie" ? (
                        <Film className="h-3 w-3" />
                      ) : (
                        <UserRound className="h-3 w-3" />
                      )}
                      {resultSubtitle(result)}
                    </span>
                  </span>
                </button>
              );
            })}

          {!isFetching && results.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="mt-1 w-full rounded-xl border-t border-white/8 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/8 hover:text-white"
            >
              View all results
            </button>
          )}
        </div>
      )}
    </div>
  );
}
