import {
  Bookmark,
  Cloud,
  Eye,
  Film,
  HardDrive,
  Heart,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import DeveloperMovieCard from "@/components/DeveloperMovieCard";
import MovieCard from "@/components/MovieCard";
import { useLibrary } from "@/context/LibraryContext";
import {
  developerFavorites,
  developerWatched,
} from "@/data/developerLibrary";

type LibraryTab =
  | "favorites"
  | "watchlist"
  | "developer-favorites"
  | "developer-watched";

const libraryTabs: LibraryTab[] = [
  "favorites",
  "watchlist",
  "developer-favorites",
  "developer-watched",
];

function isLibraryTab(value: string | null): value is LibraryTab {
  return libraryTabs.includes(value as LibraryTab);
}

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab: LibraryTab = isLibraryTab(requestedTab)
    ? requestedTab
    : "favorites";
  const {
    favorites,
    watchlist,
    clearFavorites,
    clearWatchlist,
    isSyncing,
    storageMode,
  } = useLibrary();

  const isDeveloperTab = activeTab.startsWith("developer-");
  const personalMovies = activeTab === "watchlist" ? watchlist : favorites;
  const developerMovies =
    activeTab === "developer-watched"
      ? developerWatched
      : developerFavorites;
  const activeMovieCount = isDeveloperTab
    ? developerMovies.length
    : personalMovies.length;
  const clear =
    activeTab === "favorites"
      ? clearFavorites
      : activeTab === "watchlist"
        ? clearWatchlist
        : null;

  const tabClass = (tab: LibraryTab) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
      activeTab === tab
        ? "bg-white text-black"
        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <main className="min-h-screen bg-[#09090d] pb-20 pt-28 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
          {isSyncing ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : storageMode === "cloud" ? (
            <Cloud className="h-3.5 w-3.5" />
          ) : (
            <HardDrive className="h-3.5 w-3.5" />
          )}
          {isSyncing
            ? "Syncing your Reevu library"
            : storageMode === "cloud"
              ? "Synced securely to your Reevu account"
              : "Saved on this device"}
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] sm:text-6xl">
          My List
        </h1>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchParams({ tab: "favorites" })}
              className={tabClass("favorites")}
            >
              <Heart className="h-4 w-4" />
              My Favorites ({favorites.length})
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ tab: "watchlist" })}
              className={tabClass("watchlist")}
            >
              <Bookmark className="h-4 w-4" />
              My Watchlist ({watchlist.length})
            </button>
            <span className="mx-1 hidden h-7 w-px bg-white/10 sm:block" />
            <button
              type="button"
              onClick={() => setSearchParams({ tab: "developer-favorites" })}
              className={tabClass("developer-favorites")}
            >
              <Heart className="h-4 w-4" />
              Developer Favorites ({developerFavorites.length})
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ tab: "developer-watched" })}
              className={tabClass("developer-watched")}
            >
              <Eye className="h-4 w-4" />
              Developer Watched ({developerWatched.length})
            </button>
          </div>

          {clear && activeMovieCount > 0 && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-zinc-600 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Clear {activeTab === "favorites" ? "favorites" : "watchlist"}
            </button>
          )}
        </div>

        {isDeveloperTab && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-sm leading-6 text-zinc-400">
            <Film className="mt-0.5 h-5 w-5 shrink-0 text-zinc-300" />
            <p>
              Imported from the developer&apos;s Letterboxd export. Ratings use
              the developer&apos;s five-star score, and each card opens its
              original Letterboxd film page.
            </p>
          </div>
        )}

        {activeMovieCount > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {isDeveloperTab
              ? developerMovies.map((movie) => (
                  <DeveloperMovieCard key={movie.id} movie={movie} />
                ))
              : personalMovies.map((movie) => (
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
