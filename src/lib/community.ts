import type { Movie } from "@/api/tmdb";
import { supabase } from "@/lib/supabase";

interface CommunityReviewRow {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  poster_path: string | null;
  rating: number;
  content: string;
  author_name: string;
  author_avatar: string | null;
  updated_at: string;
}

export interface CommunityMovie extends Movie {
  reevu_rating: number;
  review_count: number;
}

export interface CommunityReview {
  id: string;
  movieId: number;
  movieTitle: string;
  posterPath: string | null;
  rating: number;
  content: string;
  authorName: string;
  authorAvatar: string | null;
  updatedAt: string;
}

export interface CommunityFeed {
  topMovies: CommunityMovie[];
  recentReviews: CommunityReview[];
  totalReviews: number;
  totalMovies: number;
  totalReviewers: number;
}

export async function getCommunityFeed(): Promise<CommunityFeed> {
  if (!supabase) {
    return {
      topMovies: [],
      recentReviews: [],
      totalReviews: 0,
      totalMovies: 0,
      totalReviewers: 0,
    };
  }

  const { data, error } = await supabase
    .from("reevu_reviews")
    .select(
      "id,user_id,movie_id,movie_title,poster_path,rating,content,author_name,author_avatar,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(250);

  if (error) throw error;

  const rows = (data ?? []) as CommunityReviewRow[];
  const movies = new Map<
    number,
    {
      id: number;
      title: string;
      posterPath: string | null;
      ratingTotal: number;
      reviewCount: number;
    }
  >();

  for (const row of rows) {
    const current = movies.get(row.movie_id);
    if (current) {
      current.ratingTotal += row.rating;
      current.reviewCount += 1;
    } else {
      movies.set(row.movie_id, {
        id: row.movie_id,
        title: row.movie_title,
        posterPath: row.poster_path,
        ratingTotal: row.rating,
        reviewCount: 1,
      });
    }
  }

  const topMovies = Array.from(movies.values())
    .map<CommunityMovie>((movie) => {
      const reevuRating = movie.ratingTotal / movie.reviewCount;
      return {
        id: movie.id,
        title: movie.title,
        overview: `${movie.reviewCount} Reevu ${
          movie.reviewCount === 1 ? "member" : "members"
        } rated this ${reevuRating.toFixed(1)} out of 5.`,
        poster_path: movie.posterPath,
        backdrop_path: null,
        release_date: "",
        vote_average: reevuRating * 2,
        media_type: "movie",
        reevu_rating: reevuRating,
        review_count: movie.reviewCount,
      };
    })
    .sort(
      (a, b) =>
        b.review_count * 2 +
        b.reevu_rating -
        (a.review_count * 2 + a.reevu_rating),
    )
    .slice(0, 18);

  return {
    topMovies,
    recentReviews: rows.slice(0, 24).map((row) => ({
      id: row.id,
      movieId: row.movie_id,
      movieTitle: row.movie_title,
      posterPath: row.poster_path,
      rating: row.rating,
      content: row.content,
      authorName: row.author_name,
      authorAvatar: row.author_avatar,
      updatedAt: row.updated_at,
    })),
    totalReviews: rows.length,
    totalMovies: movies.size,
    totalReviewers: new Set(rows.map((row) => row.user_id)).size,
  };
}
