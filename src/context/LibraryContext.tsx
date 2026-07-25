import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Movie } from "@/api/tmdb";
import { useAuth } from "@/context/AuthContext";
import {
  clearCloudLibrary,
  loadCloudLibrary,
  removeCloudLibraryMovie,
  saveCloudLibraryMovie,
  type LibraryKind,
  type LibraryMovie,
} from "@/lib/library";
import { supabase } from "@/lib/supabase";

export type SavedMovie = LibraryMovie;

interface LibraryContextValue {
  favorites: SavedMovie[];
  watchlist: SavedMovie[];
  isSyncing: boolean;
  storageMode: "cloud" | "device";
  isFavorite: (movieId: number) => boolean;
  isInWatchlist: (movieId: number) => boolean;
  toggleFavorite: (movie: Movie) => void;
  toggleWatchlist: (movie: Movie) => void;
  clearFavorites: () => void;
  clearWatchlist: () => void;
}

const FAVORITES_KEY = "reevu:favorites";
const WATCHLIST_KEY = "reevu:watchlist";
const MIGRATION_KEY = "reevu:library-migrated";

const LibraryContext = createContext<LibraryContextValue | null>(null);

function readSavedMovies(key: string): SavedMovie[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as SavedMovie[]) : [];
  } catch {
    return [];
  }
}

function storageKey(baseKey: string, userId: string | null | undefined) {
  return userId ? `${baseKey}:${userId}` : baseKey;
}

function writeSavedMovies(key: string, movies: SavedMovie[]) {
  localStorage.setItem(key, JSON.stringify(movies));
}

function toSavedMovie(movie: Movie): SavedMovie {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    backdrop_path: movie.backdrop_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
  };
}

function toggleMovie(collection: SavedMovie[], movie: Movie): SavedMovie[] {
  const exists = collection.some((item) => item.id === movie.id);
  return exists
    ? collection.filter((item) => item.id !== movie.id)
    : [toSavedMovie(movie), ...collection];
}

function mergeMovies(
  localMovies: SavedMovie[],
  cloudMovies: SavedMovie[],
): SavedMovie[] {
  return Array.from(
    new Map(
      [...cloudMovies, ...localMovies].map((movie) => [movie.id, movie]),
    ).values(),
  );
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<SavedMovie[]>(() =>
    readSavedMovies(FAVORITES_KEY),
  );
  const [watchlist, setWatchlist] = useState<SavedMovie[]>(() =>
    readSavedMovies(WATCHLIST_KEY),
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudAvailable, setCloudAvailable] = useState(false);

  useEffect(() => {
    let active = true;

    if (!user || !supabase) {
      setFavorites(readSavedMovies(FAVORITES_KEY));
      setWatchlist(readSavedMovies(WATCHLIST_KEY));
      setCloudAvailable(false);
      return;
    }

    const favoritesKey = storageKey(FAVORITES_KEY, user.id);
    const watchlistKey = storageKey(WATCHLIST_KEY, user.id);
    const migrationKey = `${MIGRATION_KEY}:${user.id}`;
    const shouldMigrateDeviceLibrary =
      localStorage.getItem(migrationKey) !== "true";
    const accountFavorites = readSavedMovies(favoritesKey);
    const accountWatchlist = readSavedMovies(watchlistKey);
    const deviceFavorites = shouldMigrateDeviceLibrary
      ? readSavedMovies(FAVORITES_KEY)
      : [];
    const deviceWatchlist = shouldMigrateDeviceLibrary
      ? readSavedMovies(WATCHLIST_KEY)
      : [];

    setFavorites(mergeMovies(accountFavorites, deviceFavorites));
    setWatchlist(mergeMovies(accountWatchlist, deviceWatchlist));
    setIsSyncing(true);
    void (async () => {
      try {
        const cloud = await loadCloudLibrary(user.id);
        if (!active) return;

        const mergedFavorites = mergeMovies(
          [...accountFavorites, ...deviceFavorites],
          cloud.favorites,
        );
        const mergedWatchlist = mergeMovies(
          [...accountWatchlist, ...deviceWatchlist],
          cloud.watchlist,
        );

        setFavorites(mergedFavorites);
        setWatchlist(mergedWatchlist);
        writeSavedMovies(favoritesKey, mergedFavorites);
        writeSavedMovies(watchlistKey, mergedWatchlist);
        setCloudAvailable(true);

        await Promise.all([
          ...mergedFavorites.map((movie) =>
            saveCloudLibraryMovie(user.id, "favorite", movie),
          ),
          ...mergedWatchlist.map((movie) =>
            saveCloudLibraryMovie(user.id, "watchlist", movie),
          ),
        ]);

        if (shouldMigrateDeviceLibrary) {
          localStorage.setItem(migrationKey, "true");
          localStorage.removeItem(FAVORITES_KEY);
          localStorage.removeItem(WATCHLIST_KEY);
        }
      } catch (error) {
        console.warn(
          "Reevu library is using device storage:",
          error instanceof Error ? error.message : error,
        );
        if (active) setCloudAvailable(false);
      } finally {
        if (active) setIsSyncing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  function syncToggle(
    kind: LibraryKind,
    current: SavedMovie[],
    movie: Movie,
  ) {
    if (!user || !supabase) return;

    const exists = current.some((item) => item.id === movie.id);
    const operation = exists
      ? removeCloudLibraryMovie(user.id, kind, movie.id)
      : saveCloudLibraryMovie(user.id, kind, toSavedMovie(movie));

    void operation.catch((error: unknown) => {
      console.warn(
        "Cloud library sync failed:",
        error instanceof Error ? error.message : error,
      );
      setCloudAvailable(false);
    });
  }

  function clear(kind: LibraryKind) {
    if (!user || !supabase) return;
    void clearCloudLibrary(user.id, kind).catch((error: unknown) => {
      console.warn(
        "Cloud library clear failed:",
        error instanceof Error ? error.message : error,
      );
      setCloudAvailable(false);
    });
  }

  const value: LibraryContextValue = {
    favorites,
    watchlist,
    isSyncing,
    storageMode: user && cloudAvailable ? "cloud" : "device",
    isFavorite: (movieId) => favorites.some((movie) => movie.id === movieId),
    isInWatchlist: (movieId) =>
      watchlist.some((movie) => movie.id === movieId),
    toggleFavorite: (movie) => {
      syncToggle("favorite", favorites, movie);
      setFavorites((current) => {
        const next = toggleMovie(current, movie);
        writeSavedMovies(storageKey(FAVORITES_KEY, user?.id), next);
        return next;
      });
    },
    toggleWatchlist: (movie) => {
      syncToggle("watchlist", watchlist, movie);
      setWatchlist((current) => {
        const next = toggleMovie(current, movie);
        writeSavedMovies(storageKey(WATCHLIST_KEY, user?.id), next);
        return next;
      });
    },
    clearFavorites: () => {
      clear("favorite");
      writeSavedMovies(storageKey(FAVORITES_KEY, user?.id), []);
      setFavorites([]);
    },
    clearWatchlist: () => {
      clear("watchlist");
      writeSavedMovies(storageKey(WATCHLIST_KEY, user?.id), []);
      setWatchlist([]);
    },
  };

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);

  if (!context) {
    throw new Error("useLibrary must be used inside LibraryProvider");
  }

  return context;
}
