import { Heart, LogIn, LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import SearchBox from "@/components/SearchBox";
import { useAuth } from "@/context/AuthContext";
import { useLibrary } from "@/context/LibraryContext";

const navItems = [
  { label: "Home", to: "/" },
  { label: "Trending", to: "/browse/trending" },
  { label: "Popular", to: "/browse/popular" },
  { label: "Community", to: "/community" },
  {
    label: "Dev Favorites",
    to: "/library?tab=developer-favorites",
    tab: "developer-favorites",
  },
  {
    label: "Dev Watched",
    to: "/library?tab=developer-watched",
    tab: "developer-watched",
  },
];

export default function Header() {
  const location = useLocation();
  const { favorites, watchlist } = useLibrary();
  const { user, profile, isGuest, openSignIn, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLibraryTab = new URLSearchParams(location.search).get("tab");

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const displayName =
    profile?.full_name ??
    user?.user_metadata.full_name ??
    user?.user_metadata.name ??
    user?.email?.split("@")[0] ??
    "Account";
  const avatarUrl =
    profile?.avatar_url ??
    (user?.user_metadata.avatar_url as string | undefined) ??
    (user?.user_metadata.picture as string | undefined);
  const accountEmail = profile?.email ?? user?.email;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-black">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-5 sm:px-6">
        <Link
          to="/"
          className="header-brand-logo"
          aria-label="Reevu home"
        >
          <img
            src="/reevu-logo-fixed.png"
            alt="Reevu"
            className="header-brand-logo__image"
          />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-medium transition ${
                  item.tab
                    ? location.pathname === "/library" &&
                      activeLibraryTab === item.tab
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-white"
                    : isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden w-full max-w-xs 2xl:block">
          <SearchBox />
        </div>

        <Link
          to="/library"
          className="ml-auto hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/8 hover:text-white lg:ml-0 lg:flex"
        >
          <Heart className="h-4 w-4" />
          My List
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
            {favorites.length + watchlist.length}
          </span>
        </Link>

        {user ? (
          <div className="hidden items-center gap-2 lg:flex">
            <div className="flex max-w-40 items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pr-3 pl-1.5 text-sm text-zinc-200">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
                  <UserRound className="h-4 w-4" />
                </span>
              )}
              <span className="truncate">{displayName}</span>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
              title="Sign out"
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : isGuest ? (
          <button
            type="button"
            onClick={openSignIn}
            className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 lg:flex"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="ml-auto rounded-full p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/8 bg-black px-5 py-5 lg:hidden">
          <div className="mx-auto max-w-7xl">
            <SearchBox />
            <nav className="mt-4 grid gap-1" aria-label="Mobile navigation">
              {[...navItems, { label: "My List", to: "/library" }].map(
                (item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-xl px-4 py-3 text-sm font-medium transition ${
                        item.tab
                          ? location.pathname === "/library" &&
                            activeLibraryTab === item.tab
                            ? "bg-white/10 text-white"
                            : "text-zinc-400 hover:bg-white/5 hover:text-white"
                          : isActive
                          ? "bg-white/10 text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ),
              )}
            </nav>

            <div className="mt-4 border-t border-white/8 pt-4">
              {user ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
                        <UserRound className="h-4 w-4" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{displayName}</p>
                      <p className="truncate text-xs text-zinc-500">{accountEmail}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Sign out"
                    onClick={() => void signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openSignIn}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in to Reevu
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
