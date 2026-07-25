import { Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";

import { getPosterUrl, type Movie } from "@/api/tmdb";
import { useLibrary } from "@/context/LibraryContext";
import ImageWithFallback from "@/components/ImageWithFallback";

interface MovieCardProps {
  movie: Movie;
  layout?: "row" | "grid";
  rank?: number;
}

export default function MovieCard({
  movie,
  layout = "row",
  rank,
}: MovieCardProps) {
  const { isFavorite, toggleFavorite } = useLibrary();
  const favorite = isFavorite(movie.id);
  const year = movie.release_date?.slice(0, 4) || "TBA";

  return (
    <article
      className={`group relative min-w-0 ${
        layout === "row"
          ? "w-[150px] shrink-0 snap-start sm:w-[185px]"
          : "w-full"
      }`}
    >
      <Link to={`/movie/${movie.id}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/8 transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/20">
          <ImageWithFallback
            src={getPosterUrl(movie.poster_path)}
            alt={`${movie.title} poster`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/0 to-black/0 opacity-70" />

          {typeof rank === "number" && (
            <span className="absolute bottom-1 left-2 text-6xl font-black leading-none text-white drop-shadow-2xl">
              {rank}
            </span>
          )}

          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {movie.vote_average > 0 ? movie.vote_average.toFixed(1) : "NR"}
          </span>
        </div>

        <div className="mt-3 min-w-0">
          <h3 className="truncate font-semibold text-zinc-100 transition group-hover:text-white">
            {movie.title}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">{year}</p>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggleFavorite(movie)}
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/65 p-2 text-white opacity-100 backdrop-blur-md transition hover:scale-105 hover:bg-black/85 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Heart className={`h-4 w-4 ${favorite ? "fill-red-500 text-red-500" : ""}`} />
      </button>
    </article>
  );
}
