import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Cloud,
  Edit3,
  LoaderCircle,
  Save,
  Star,
  Trash2,
} from "lucide-react";

import type { Movie } from "@/api/tmdb";
import { useAuth } from "@/context/AuthContext";
import {
  deleteReevuReview,
  getReviewOwnerId,
  listReevuReviews,
  saveReevuReview,
  type ReevuReview,
} from "@/lib/reviews";

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ReviewSection({ movie }: { movie: Movie }) {
  const { user, isGuest, openSignIn } = useAuth();
  const queryClient = useQueryClient();
  const ownerId = useMemo(
    () => getReviewOwnerId(user?.id ?? null),
    [user?.id],
  );
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const {
    data: reviews = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["reevu-reviews", movie.id],
    queryFn: () => listReevuReviews(movie.id),
  });

  const myReview = reviews.find((review) => review.owner_id === ownerId);

  useEffect(() => {
    if (!myReview || isEditing) return;
    setRating(myReview.rating);
    setContent(myReview.content);
  }, [isEditing, myReview]);

  const authorName =
    user?.user_metadata.full_name ??
    user?.user_metadata.name ??
    user?.email?.split("@")[0] ??
    "Guest viewer";
  const authorAvatar =
    (user?.user_metadata.avatar_url as string | undefined) ?? null;

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (rating < 1) {
      setMessage("Choose a star rating before publishing.");
      return;
    }

    const normalizedContent = content.trim();
    if (normalizedContent.length < 10) {
      setMessage("Write at least 10 characters about the film.");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveReevuReview({
        movieId: movie.id,
        movieTitle: movie.title,
        posterPath: movie.poster_path,
        rating,
        content: normalizedContent,
        userId: user?.id ?? null,
        authorName,
        authorAvatar,
      });
      await queryClient.invalidateQueries({
        queryKey: ["reevu-reviews", movie.id],
      });
      setIsEditing(false);
      setMessage(
        saved.storage === "cloud"
          ? "Your review is published."
          : "Your review is saved on this device.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The review could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeReview(review: ReevuReview) {
    setDeletingId(review.id);
    setMessage(null);
    try {
      await deleteReevuReview(review);
      setRating(0);
      setContent("");
      setIsEditing(false);
      await queryClient.invalidateQueries({
        queryKey: ["reevu-reviews", movie.id],
      });
      setMessage("Your review was deleted.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The review could not be deleted.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-500">
        Reevu community
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Ratings & reviews</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Written by Reevu members, not imported from TMDB.
          </p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {(
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviews.length
            ).toFixed(1)}
            <span className="text-zinc-600">from {reviews.length}</span>
          </div>
        )}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <form
          onSubmit={submitReview}
          className="h-fit rounded-3xl border border-white/8 bg-white/[0.035] p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-zinc-100">
              {myReview ? "Your review" : "Write a review"}
            </h3>
            {myReview && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-white"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>

          <fieldset className="mt-5" disabled={Boolean(myReview) && !isEditing}>
            <legend className="text-sm text-zinc-400">Your rating</legend>
            <div className="mt-2 flex gap-1" aria-label={`${rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-lg p-1.5 text-zinc-700 transition hover:text-amber-300 disabled:cursor-default"
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      value <= rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-transparent"
                    }`}
                  />
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-sm text-zinc-400">Your thoughts</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={6}
                maxLength={2000}
                placeholder="What stayed with you after watching?"
                className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-zinc-950/70 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-700 focus:border-white/25"
              />
            </label>
          </fieldset>

          {isGuest && (
            <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-xs leading-5 text-zinc-500">
              <span>Guest reviews stay on this device.</span>
              <button
                type="button"
                onClick={openSignIn}
                className="shrink-0 font-semibold text-zinc-300 hover:text-white"
              >
                Sign in
              </button>
            </div>
          )}

          {message && (
            <p className="mt-4 text-sm leading-6 text-zinc-300" role="status">
              {message}
            </p>
          )}

          {(!myReview || isEditing) && (
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {myReview ? "Save changes" : "Publish review"}
              </button>
              {myReview && (
                <button
                  type="button"
                  onClick={() => {
                    setRating(myReview.rating);
                    setContent(myReview.content);
                    setIsEditing(false);
                    setMessage(null);
                  }}
                  className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </form>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 py-12 text-sm text-zinc-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Loading Reevu reviews...
            </div>
          )}

          {isError && (
            <p className="py-8 text-sm text-zinc-500">
              Reviews could not be loaded right now.
            </p>
          )}

          {!isLoading && reviews.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center">
              <Star className="mx-auto h-8 w-8 text-zinc-700" />
              <h3 className="mt-4 font-semibold">Be the first to review it</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Your take becomes part of the Reevu community.
              </p>
            </div>
          )}

          {reviews.map((review) => {
            const owned = review.owner_id === ownerId;
            return (
              <article
                key={review.id}
                className="rounded-3xl border border-white/8 bg-white/[0.035] p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-100">
                        {review.author_name}
                      </h3>
                      {review.storage === "cloud" && (
                        <Cloud
                          className="h-3.5 w-3.5 text-zinc-600"
                          aria-label="Synced to account"
                        />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-600">
                      {formatReviewDate(review.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-xs text-zinc-300">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {review.rating}/5
                    </span>
                    {owned && (
                      <button
                        type="button"
                        onClick={() => void removeReview(review)}
                        disabled={deletingId === review.id}
                        className="rounded-full p-2 text-zinc-600 transition hover:bg-red-500/10 hover:text-red-300"
                        aria-label="Delete your review"
                      >
                        {deletingId === review.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-zinc-400">
                  {review.content}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
