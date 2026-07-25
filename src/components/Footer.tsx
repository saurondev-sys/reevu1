import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/8 bg-[#07070a]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 text-sm text-zinc-600 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            to="/"
            className="text-xl font-black tracking-[-0.07em] text-zinc-200"
          >
            Reevu
          </Link>
          <p className="mt-2">Find something worth watching.</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link to="/browse/trending" className="transition hover:text-white">
            Trending
          </Link>
          <Link to="/browse/top-rated" className="transition hover:text-white">
            Top rated
          </Link>
          <Link to="/library" className="transition hover:text-white">
            My list
          </Link>
          <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
        </div>
      </div>
    </footer>
  );
}
