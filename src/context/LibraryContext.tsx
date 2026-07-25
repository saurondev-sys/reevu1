import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Movie } from "@/api/tmdb";

export interface SavedMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
}

interface LibraryContextValue {
  favorites: SavedMovie[];
  watchlist: SavedMovie[];
  isFavorite: (movieId: number) => boolean;
  isInWatchlist: (movieId: number) => boolean;
  toggleFavorite: (movie: Movie) => void;
  toggleWatchlist: (movie: Movie) => void;
  clearFavorites: () => void;
  clearWatchlist: () => void;
}

const FAVORITES_KEY = "reevu:favorites";
const WATCHLIST_KEY = "reevu:watchlist";

const LibraryContext = createContext<LibraryContextValue | null>(null);

function readSavedMovies(key: string): SavedMovie[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as SavedMovie[]) : [];
  } catch {
    return [];
  }
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

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<SavedMovie[]>(() =>
    readSavedMovies(FAVORITES_KEY),
  );
  const [watchlist, setWatchlist] = useState<SavedMovie[]>(() =>
    readSavedMovies(WATCHLIST_KEY),
  );

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const value = useMemo<LibraryContextValue>(
    () => ({
      favorites,
      watchlist,
      isFavorite: (movieId) => favorites.some((movie) => movie.id === movieId),
      isInWatchlist: (movieId) =>
        watchlist.some((movie) => movie.id === movieId),
      toggleFavorite: (movie) =>
        setFavorites((current) => toggleMovie(current, movie)),
      toggleWatchlist: (movie) =>
        setWatchlist((current) => toggleMovie(current, movie)),
      clearFavorites: () => setFavorites([]),
      clearWatchlist: () => setWatchlist([]),
    }),
    [favorites, watchlist],
  );

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
