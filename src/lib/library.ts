import { supabase } from "@/lib/supabase";

export type LibraryKind = "favorite" | "watchlist";

export interface LibraryMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
}

interface CloudLibraryRow {
  kind: LibraryKind;
  movie_id: number;
  movie_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
}

export interface CloudLibrary {
  favorites: LibraryMovie[];
  watchlist: LibraryMovie[];
}

function fromCloudRow(row: CloudLibraryRow): LibraryMovie {
  return {
    id: row.movie_id,
    title: row.movie_title,
    overview: row.overview,
    poster_path: row.poster_path,
    backdrop_path: row.backdrop_path,
    release_date: row.release_date,
    vote_average: row.vote_average,
  };
}

export async function loadCloudLibrary(userId: string): Promise<CloudLibrary> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("reevu_library")
    .select(
      "kind,movie_id,movie_title,overview,poster_path,backdrop_path,release_date,vote_average",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as CloudLibraryRow[];
  return {
    favorites: rows
      .filter((row) => row.kind === "favorite")
      .map(fromCloudRow),
    watchlist: rows
      .filter((row) => row.kind === "watchlist")
      .map(fromCloudRow),
  };
}

export async function saveCloudLibraryMovie(
  userId: string,
  kind: LibraryKind,
  movie: LibraryMovie,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("reevu_library").upsert(
    {
      user_id: userId,
      kind,
      movie_id: movie.id,
      movie_title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,kind,movie_id" },
  );

  if (error) throw error;
}

export async function removeCloudLibraryMovie(
  userId: string,
  kind: LibraryKind,
  movieId: number,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from("reevu_library")
    .delete()
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("movie_id", movieId);

  if (error) throw error;
}

export async function clearCloudLibrary(
  userId: string,
  kind: LibraryKind,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from("reevu_library")
    .delete()
    .eq("user_id", userId)
    .eq("kind", kind);

  if (error) throw error;
}
