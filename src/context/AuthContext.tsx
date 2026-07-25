import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { syncUserProfile, type UserProfile } from "@/lib/profile";

const GUEST_SESSION_KEY = "reevu:guest-mode";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  openSignIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readGuestMode() {
  return sessionStorage.getItem(GUEST_SESSION_KEY) === "true";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isGuest, setIsGuest] = useState(readGuestMode);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;

      if (!error) {
        setSession(data.session);
        if (data.session) {
          setProfile(await syncUserProfile(data.session.user));
          sessionStorage.removeItem(GUEST_SESSION_KEY);
          setIsGuest(false);
        } else {
          setProfile(null);
        }
      }

      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);

      if (nextSession) {
        sessionStorage.removeItem(GUEST_SESSION_KEY);
        setIsGuest(false);
        void syncUserProfile(nextSession.user).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const continueAsGuest = useCallback(() => {
    sessionStorage.setItem(GUEST_SESSION_KEY, "true");
    setIsGuest(true);
  }, []);

  const openSignIn = useCallback(() => {
    sessionStorage.removeItem(GUEST_SESSION_KEY);
    setIsGuest(false);
  }, []);

  const signOut = useCallback(async () => {
    sessionStorage.removeItem(GUEST_SESSION_KEY);
    setIsGuest(false);

    if (supabase) {
      await supabase.auth.signOut();
    }

    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      isConfigured: isSupabaseConfigured,
      isGuest,
      continueAsGuest,
      openSignIn,
      signOut,
    }),
    [continueAsGuest, isGuest, isLoading, openSignIn, profile, session, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
