import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  type Location,
} from "react-router-dom";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import IntroVideo from "@/components/IntroVideo";
import { useAuth } from "@/context/AuthContext";
import AuthPage from "@/pages/Auth";
import Browse from "@/pages/Browse";
import Home from "@/pages/Home";
import Library from "@/pages/Library";
import MovieDetails from "@/pages/MovieDetails";
import NotFound from "@/pages/NotFound";
import PersonDetails from "@/pages/PersonDetails";
import SearchResults from "@/pages/SearchResults";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

function AuthLoadingScreen() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#09090d] text-white">
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        Loading Reevu
      </div>
    </main>
  );
}

interface AuthRouteState {
  from?: Location;
  requiresAuth?: boolean;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location, requiresAuth: true } satisfies AuthRouteState}
      />
    );
  }

  return children;
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const { session, isLoading, isGuest } = useAuth();
  const location = useLocation();

  if (showIntro) {
    return <IntroVideo onComplete={() => setShowIntro(false)} />;
  }

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  if (location.pathname === "/auth") {
    const routeState = location.state as AuthRouteState | null;

    if (session || (isGuest && !routeState?.requiresAuth)) {
      const destination = routeState?.from
        ? `${routeState.from.pathname}${routeState.from.search}${routeState.from.hash}`
        : "/";

      return <Navigate to={destination} replace />;
    }

    return <AuthPage />;
  }

  if (!session && !isGuest) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location } satisfies AuthRouteState}
      />
    );
  }

  return (
    <>
      <ScrollToTop />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:movieId" element={<MovieDetails />} />
        <Route path="/person/:personId" element={<PersonDetails />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/browse/:category" element={<Browse />} />
        <Route
          path="/library"
          element={
            <RequireAuth>
              <Library />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
