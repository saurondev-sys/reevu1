import { AlertTriangle, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090d] px-6 pt-16 text-white">
      <div className="flex items-center gap-3 text-zinc-400">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        {label}
      </div>
    </main>
  );
}

export function PageError({
  title = "Something went wrong",
  message = "We could not load this page. Check your TMDB token and internet connection.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090d] px-6 pt-16 text-center text-white">
      <div className="max-w-md">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
        <h1 className="mt-5 text-3xl font-bold">{title}</h1>
        <p className="mt-3 leading-7 text-zinc-500">{message}</p>
        <Link
          to="/"
          className="mt-7 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}
