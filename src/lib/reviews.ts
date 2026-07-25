import { supabase } from "@/lib/supabase";

const LOCAL_REVIEWS_KEY = "reevu:reviews:v1";
const LOCAL_OWNER_KEY = "reevu:review-owner";

export type ReviewStorage = "cloud" | "device";

export interface ReevuReview {
  id: string;
  movie_id: number;
  movie_title: string;
  poster_path: string | null;
  rating: number;
  content: string;
  owner_id: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  updated_at: string;
  storage: ReviewStorage;
}

export interface SaveReviewInput {
  movieId: number;
  movieTitle: string;
  posterPath: string | null;
  rating: number;
  content: string;
  userId: string | null;
  authorName: string;
  authorAvatar: string | null;
}

interface CloudReviewRow {
  id: string;
  movie_id: number;
  movie_title: string;
  poster_path: string | null;
  rating: number;
  content: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  updated_at: string;
}

function readDeviceReviews(): ReevuReview[] {
  try {
    const stored = localStorage.getItem(LOCAL_REVIEWS_KEY);
    return stored ? (JSON.parse(stored) as ReevuReview[]) : [];
  } catch {
    return [];
  }
}

function writeDeviceReviews(reviews: ReevuReview[]) {
  localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(reviews));
}

export function getReviewOwnerId(userId: string | null): string {
  if (userId) return userId;

  const existing = localStorage.getItem(LOCAL_OWNER_KEY);
  if (existing) return existing;

  const ownerId = `device:${crypto.randomUUID()}`;
  localStorage.setItem(LOCAL_OWNER_KEY, ownerId);
  return ownerId;
}

function fromCloudRow(row: CloudReviewRow): ReevuReview {
  return {
    id: row.id,
    movie_id: row.movie_id,
    movie_title: row.movie_title,
    poster_path: row.poster_path,
    rating: row.rating,
    content: row.content,
    owner_id: row.user_id,
    author_name: row.author_name,
    author_avatar: row.author_avatar,
    created_at: row.created_at,
    updated_at: row.updated_at,
    storage: "cloud",
  };
}

export async function listReevuReviews(movieId: number): Promise<ReevuReview[]> {
  const deviceReviews = readDeviceReviews().filter(
    (review) => review.movie_id === movieId,
  );

  if (!supabase) {
    return deviceReviews.sort(
      (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at),
    );
  }

  const { data, error } = await supabase
    .from("reevu_reviews")
    .select(
      "id,movie_id,movie_title,poster_path,rating,content,user_id,author_name,author_avatar,created_at,updated_at",
    )
    .eq("movie_id", movieId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("Reevu reviews are using device storage:", error.message);
    return deviceReviews;
  }

  const cloudReviews = (data as CloudReviewRow[]).map(fromCloudRow);
  const cloudOwners = new Set(cloudReviews.map((review) => review.owner_id));

  return [
    ...cloudReviews,
    ...deviceReviews.filter((review) => !cloudOwners.has(review.owner_id)),
  ];
}

function saveDeviceReview(
  input: SaveReviewInput,
  ownerId: string,
): ReevuReview {
  const reviews = readDeviceReviews();
  const existing = reviews.find(
    (review) =>
      review.movie_id === input.movieId && review.owner_id === ownerId,
  );
  const now = new Date().toISOString();
  const review: ReevuReview = {
    id: existing?.id ?? crypto.randomUUID(),
    movie_id: input.movieId,
    movie_title: input.movieTitle,
    poster_path: input.posterPath,
    rating: input.rating,
    content: input.content,
    owner_id: ownerId,
    author_name: input.authorName,
    author_avatar: input.authorAvatar,
    created_at: existing?.created_at ?? now,
    updated_at: now,
    storage: "device",
  };

  writeDeviceReviews([
    review,
    ...reviews.filter((item) => item.id !== review.id),
  ]);
  return review;
}

export async function saveReevuReview(
  input: SaveReviewInput,
): Promise<ReevuReview> {
  const ownerId = getReviewOwnerId(input.userId);

  if (supabase && input.userId) {
    const payload = {
      user_id: input.userId,
      movie_id: input.movieId,
      movie_title: input.movieTitle,
      poster_path: input.posterPath,
      rating: input.rating,
      content: input.content,
      author_name: input.authorName,
      author_avatar: input.authorAvatar,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("reevu_reviews")
      .upsert(payload, { onConflict: "user_id,movie_id" })
      .select(
        "id,movie_id,movie_title,poster_path,rating,content,user_id,author_name,author_avatar,created_at,updated_at",
      )
      .single();

    if (!error && data) {
      return fromCloudRow(data as CloudReviewRow);
    }

    console.warn("Cloud review save failed; saved on this device:", error?.message);
  }

  return saveDeviceReview(input, ownerId);
}

export async function deleteReevuReview(review: ReevuReview): Promise<void> {
  if (review.storage === "cloud" && supabase) {
    const { error } = await supabase
      .from("reevu_reviews")
      .delete()
      .eq("id", review.id);

    if (!error) return;
    throw new Error(error.message);
  }

  writeDeviceReviews(
    readDeviceReviews().filter((item) => item.id !== review.id),
  );
}
