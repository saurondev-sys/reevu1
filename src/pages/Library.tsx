import { Bookmark, Heart, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import MovieCard from "@/components/MovieCard";
import { useLibrary } from "@/context/LibraryContext";

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "watchlist" ? "watchlist" : "favorites";
  const {
    favorites,
    watchlist,
    clearFavorites,
    clearWatchlist,
  } = useLibrary();

  const movies = activeTab === "favorites" ? favorites : watchlist;
  const clear = activeTab === "favorites" ? clearFavorites : clearWatchlist;

  return (
    <main className="min-h-screen bg-[#09090d] pb-20 pt-28 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Saved locally on this device
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] sm:text-6xl">
          My List
        </h1>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSearchParams({ tab: "favorites" })}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === "favorites"
                  ? "bg-white text-black"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Heart className="h-4 w-4" />
              Favorites ({favorites.length})
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ tab: "watchlist" })}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === "watchlist"
                  ? "bg-white text-black"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Bookmark className="h-4 w-4" />
              Watchlist ({watchlist.length})
            </button>
          </div>

          {movies.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-zinc-600 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Clear {activeTab}
            </button>
          )}
        </div>

        {movies.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="mt-16 rounded-3xl border border-white/8 bg-white/[0.03] px-6 py-16 text-center">
            {activeTab === "favorites" ? (
              <Heart className="mx-auto h-11 w-11 text-zinc-700" />
            ) : (
              <Bookmark className="mx-auto h-11 w-11 text-zinc-700" />
            )}
            <h2 className="mt-5 text-2xl font-bold">
              Your {activeTab} is empty
            </h2>
            <p className="mx-auto mt-2 max-w-md leading-7 text-zinc-500">
              Save movies from the home page or movie details pages. They will
              appear here automatically.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
