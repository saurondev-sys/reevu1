import { Film } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090d] px-6 pt-16 text-center text-white">
      <div>
        <Film className="mx-auto h-12 w-12 text-zinc-700" />
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-600">
          404
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">
          This scene does not exist.
        </h1>
        <p className="mt-3 text-zinc-500">
          The page may have moved, or the URL is incorrect.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
        >
          Back to Reevu
        </Link>
      </div>
    </main>
  );
}
