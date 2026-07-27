import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type AuthMode = "signin" | "signup";
type OAuthProvider = "google";

interface Notice {
  type: "success" | "error" | "info";
  message: string;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.93a6.02 6.02 0 0 1 0-3.86V7.45H3.04a10 10 0 0 0 0 9.1l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.78.5 3.82 1.5l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
      />
    </svg>
  );
}

function SocialButton({
  provider,
  label,
  icon,
  loadingProvider,
  onClick,
}: {
  provider: OAuthProvider;
  label: string;
  icon: ReactNode;
  loadingProvider: OAuthProvider | null;
  onClick: (provider: OAuthProvider) => void;
}) {
  const isLoading = loadingProvider === provider;

  return (
    <button
      type="button"
      className="auth-social-button"
      onClick={() => onClick(provider)}
      disabled={loadingProvider !== null}
    >
      {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : icon}
      <span>{label}</span>
    </button>
  );
}

export default function AuthPage() {
  const { continueAsGuest, isConfigured } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get("mode") === "signup" ? "signup" : "signin",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] =
    useState<OAuthProvider | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  function requireSupabase() {
    if (supabase) return true;

    setNotice({
      type: "info",
      message:
        "Connect Supabase in the .env file to activate real sign-in and OTP delivery.",
    });
    return false;
  }

  async function handleOAuth(provider: OAuthProvider) {
    if (!requireSupabase() || !supabase) return;

    setNotice(null);
    setLoadingProvider(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setNotice({ type: "error", message: error.message });
      setLoadingProvider(null);
    }
  }

  async function sendEmailOtp() {
    if (!requireSupabase() || !supabase) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setNotice({
        type: "error",
        message: "Enter a valid email address.",
      });
      return;
    }

    if (mode === "signup" && name.trim().length < 2) {
      setNotice({
        type: "error",
        message: "Enter your full name to create an account.",
      });
      return;
    }

    setNotice(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: mode === "signup",
          data:
            mode === "signup"
              ? {
                  full_name: name.trim(),
                }
              : undefined,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      setEmail(normalizedEmail);
      setOtp("");
      setOtpSent(true);
      setResendSeconds(60);
      setNotice({
        type: "success",
        message: "A 6-digit verification code was sent to your email.",
      });
    } catch (error) {
      const authError =
        typeof error === "object" && error !== null
          ? (error as { code?: unknown; message?: unknown; status?: unknown })
          : null;
      const code =
        typeof authError?.code === "string" ? authError.code : undefined;
      const status =
        typeof authError?.status === "number" ? authError.status : undefined;
      const rawMessage =
        error instanceof Error
          ? error.message
          : typeof authError?.message === "string"
            ? authError.message
            : "";
      const message = rawMessage.trim();

      console.error("Email OTP request failed", {
        code,
        status,
        message,
      });

      if (
        mode === "signin" &&
        /signups? not allowed for otp/i.test(message)
      ) {
        setMode("signup");
        setNotice({
          type: "info",
          message:
            "No Reevu account exists for this email yet. Enter your name below to create one.",
        });
        return;
      }

      if (code === "over_email_send_rate_limit" || status === 429) {
        setNotice({
          type: "error",
          message:
            "Too many verification emails were requested. Wait a few minutes, then try again.",
        });
        return;
      }

      if (code === "email_address_not_authorized") {
        setNotice({
          type: "error",
          message:
            "Email delivery is not fully connected yet. Check the custom SMTP settings in Supabase.",
        });
        return;
      }

      if (
        code === "unexpected_failure" ||
        !message ||
        message === "{}"
      ) {
        setNotice({
          type: "error",
          message:
            "The email service could not send this code. Verify the Brevo sender and SMTP credentials in Supabase, then try again.",
        });
        return;
      }

      setNotice({
        type: "error",
        message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendEmailOtp();
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireSupabase() || !supabase) return;

    if (!/^\d{6}$/.test(otp.trim())) {
      setNotice({ type: "error", message: "Enter the complete 6-digit OTP." });
      return;
    }

    setNotice(null);
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp.trim(),
      type: "email",
    });

    setLoading(false);

    if (error) {
      setNotice({ type: "error", message: error.message });
    } else {
      setNotice({
        type: "success",
        message: "You are signed in. Welcome to Reevu.",
      });
    }
  }

  async function resendOtp() {
    if (resendSeconds > 0) return;
    await sendEmailOtp();
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow--one" />
      <div className="auth-glow auth-glow--two" />
      <div className="auth-noise" />

      <motion.section
        className="auth-shell"
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="auth-brand-panel">
          <div>
            <div className="auth-wordmark">Reevu</div>
            <p className="auth-kicker">YOUR CINEMA, YOUR STORY</p>
          </div>

          <div className="auth-brand-copy">
            <h1>Find something worth watching.</h1>
            <p>
              Rate films, build your watchlist and discover your next favourite
              movie—all in one beautiful place.
            </p>
          </div>

          <div className="auth-trust-row">
            <ShieldCheck className="h-5 w-5" />
            <span>Secure sign-in powered by Supabase authentication.</span>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-heading">
            <p className="auth-eyebrow">WELCOME TO REEVU</p>
            <h2>{mode === "signin" ? "Sign in" : "Create your account"}</h2>
            <p>
              {mode === "signin"
                ? "Continue your watchlist and ratings."
                : "Start rating, tracking and discovering movies."}
            </p>
          </div>

          {!isConfigured && (
            <div className="auth-setup-notice">
              Preview mode: the page is ready, but real accounts and OTPs need
              the Supabase keys described in <code>AUTH_SETUP.md</code>.
            </div>
          )}

          <div className="auth-social-grid">
            <SocialButton
              provider="google"
              label="Continue with Google"
              icon={<GoogleIcon />}
              loadingProvider={loadingProvider}
              onClick={handleOAuth}
            />
          </div>

          <div className="auth-divider"><span>or use your email</span></div>

          {notice && (
            <div className={`auth-message auth-message--${notice.type}`}>
              {notice.type === "success" && <CheckCircle2 className="h-4 w-4" />}
              <span>{notice.message}</span>
            </div>
          )}

          {otpSent ? (
            <form className="auth-form" onSubmit={verifyOtp}>
              <button
                type="button"
                className="auth-back-button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setResendSeconds(0);
                  setNotice(null);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Change email address
              </button>

              <label className="auth-field">
                <span>6-digit email code</span>
                <input
                  className="auth-otp-input"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  autoFocus
                />
              </label>

              <button className="auth-primary-button" type="submit" disabled={loading}>
                {loading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
                Verify and continue
              </button>

              <button
                type="button"
                className="auth-resend-button"
                onClick={() => void resendOtp()}
                disabled={loading || resendSeconds > 0}
              >
                {resendSeconds > 0
                  ? `Resend OTP in ${resendSeconds}s`
                  : "Resend OTP"}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleEmailSubmit}>
              {mode === "signup" && (
                <label className="auth-field">
                  <span>Full name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Rahul Chabbi"
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label className="auth-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <button className="auth-primary-button" type="submit" disabled={loading}>
                {loading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
                {mode === "signin" ? "Send login code" : "Send signup code"}
              </button>
            </form>
          )}

          <div className="auth-switch-copy">
            {mode === "signin" ? "New to Reevu?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setMode((current) => current === "signin" ? "signup" : "signin");
                setOtpSent(false);
                setOtp("");
                setResendSeconds(0);
                setNotice(null);
              }}
            >
              {mode === "signin" ? "Create account" : "Sign in"}
            </button>
          </div>

          <button type="button" className="auth-guest-button" onClick={continueAsGuest}>
            Explore as guest
          </button>

          <p className="auth-legal">
            By continuing, you agree to Reevu&apos;s Terms and Privacy Policy.
          </p>
        </div>
      </motion.section>
    </main>
  );
}
