import { useQuery } from "@tanstack/react-query";
import {
  Clapperboard,
  MessageSquareText,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getPosterUrl } from "@/api/tmdb";
import ImageWithFallback from "@/components/ImageWithFallback";
import { PageError, PageLoader } from "@/components/PageState";
import { getCommunityFeed } from "@/lib/community";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function Community() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["reevu-community"],
    queryFn: getCommunityFeed,
    staleTime: 1000 * 60 * 2,
  });

  if (isLoading) {
    return <PageLoader label="Loading the Reevu community..." />;
  }

  if (isError || !data) {
    return <PageError title="The community feed is unavailable" />;
  }

  return (
    <main className="min-h-screen bg-[#09090d] pb-24 pt-28 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(190,24,38,0.2),transparent_42%),rgba(255,255,255,0.025)] p-7 sm:p-10 lg:p-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-400/15 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-100">
            <Sparkles className="h-3.5 w-3.5" />
            Built by Reevu members
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.055em] sm:text-7xl">
            Real people. Real reactions.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
            Discover what the Reevu community loves, read original reviews, and
            help shape a movie space that belongs to its members.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Member reviews",
                value: data.totalReviews,
                icon: MessageSquareText,
              },
              {
                label: "Movies discussed",
                value: data.totalMovies,
                icon: Clapperboard,
              },
              {
                label: "Contributors",
                value: data.totalReviewers,
                icon: Users,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/8 bg-black/20 p-5 backdrop-blur-sm"
              >
                <stat.icon className="h-5 w-5 text-zinc-500" />
                <p className="mt-5 text-3xl font-black">{stat.value}</p>
                <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {data.topMovies.length > 0 ? (
          <>
            <section className="py-16">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                The Reevu chart
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Most loved by members
              </h2>

              <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {data.topMovies.slice(0, 12).map((movie) => (
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.id}`}
                    className="group min-w-0"
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-zinc-900">
                      <ImageWithFallback
                        src={getPosterUrl(movie.poster_path)}
                        alt={`${movie.title} poster`}
                        className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:scale-[1.035]"
                        loading="lazy"
                      />
                      <div className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/80 px-2.5 py-1 text-xs font-semibold backdrop-blur">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {movie.reevu_rating.toFixed(1)}/5
                      </div>
                    </div>
                    <h3 className="mt-3 truncate font-semibold text-zinc-100">
                      {movie.title}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {movie.review_count}{" "}
                      {movie.review_count === 1 ? "review" : "reviews"}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                Fresh from the community
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Latest reviews
              </h2>

              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                {data.recentReviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-3xl border border-white/8 bg-white/[0.03] p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {review.authorAvatar ? (
                          <img
                            src={review.authorAvatar}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8 text-sm font-bold text-zinc-300">
                            {review.authorName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-zinc-200">
                            {review.authorName}
                          </p>
                          <p className="text-xs text-zinc-600">
                            {formatDate(review.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-xs text-zinc-300">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {review.rating}/5
                      </span>
                    </div>

                    <Link
                      to={`/movie/${review.movieId}`}
                      className="mt-5 block font-semibold text-white hover:underline"
                    >
                      {review.movieTitle}
                    </Link>
                    <p className="mt-3 line-clamp-4 whitespace-pre-line text-sm leading-7 text-zinc-400">
                      {review.content}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="mt-10 rounded-3xl border border-dashed border-white/10 px-6 py-20 text-center">
            <MessageSquareText className="mx-auto h-10 w-10 text-zinc-700" />
            <h2 className="mt-5 text-2xl font-bold">The conversation starts now</h2>
            <p className="mx-auto mt-3 max-w-lg leading-7 text-zinc-500">
              Review a movie and it will become part of Reevu’s own community
              discovery chart.
            </p>
            <Link
              to="/"
              className="mt-7 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
            >
              Explore movies
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
