import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { getPersonPageData, getProfileUrl } from "@/api/tmdb";
import ImageWithFallback from "@/components/ImageWithFallback";
import MovieCard from "@/components/MovieCard";
import { PageError, PageLoader } from "@/components/PageState";

function formatDate(date: string | null): string {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function PersonDetails() {
  const { personId } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["person-page", personId],
    queryFn: () => getPersonPageData(personId!),
    enabled: Boolean(personId),
  });

  if (isLoading) {
    return <PageLoader label="Loading person details..." />;
  }

  if (isError || !data) {
    return <PageError title="Could not load this person" />;
  }

  const { person, movies } = data;

  return (
    <main className="min-h-screen bg-[#09090d] pb-20 pt-24 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/8 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <section className="mt-8 grid gap-10 md:grid-cols-[280px_1fr] lg:gap-14">
          <ImageWithFallback
            src={getProfileUrl(person.profile_path)}
            alt={person.name}
            fallbackType="person"
            className="aspect-[2/3] w-full max-w-[300px] rounded-3xl object-cover ring-1 ring-white/10"
          />

          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
              {person.known_for_department || "Film professional"}
            </p>
            <h1 className="mt-3 text-5xl font-black tracking-[-0.05em] sm:text-7xl">
              {person.name}
            </h1>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-zinc-400">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Born {formatDate(person.birthday)}
              </span>
              {person.place_of_birth && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {person.place_of_birth}
                </span>
              )}
            </div>

            <h2 className="mt-10 text-2xl font-bold">Biography</h2>
            <p className="mt-4 whitespace-pre-line text-base leading-8 text-zinc-400 sm:text-lg">
              {person.biography || "No biography is currently available."}
            </p>

            {person.homepage && (
              <a
                href={person.homepage}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/8 hover:text-white"
              >
                Official website
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </section>

        <section className="mt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Filmography
          </p>
          <h2 className="mt-2 text-3xl font-bold">Known for</h2>

          {movies.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} layout="grid" />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-zinc-500">No movie credits were found.</p>
          )}
        </section>
      </div>
    </main>
  );
}
