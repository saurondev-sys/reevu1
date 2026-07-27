import { useCallback, useEffect, useRef, useState } from "react";

type IntroVideoProps = {
  onComplete: () => void;
};

const FADE_DURATION_MS = 300;
const VISIBLE_DURATION_MS = 2000;

export default function IntroVideo({ onComplete }: IntroVideoProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const hasCompleted = useRef(false);
  const completionTimer = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const clearCompletionTimer = useCallback(() => {
    if (completionTimer.current !== null) {
      window.clearTimeout(completionTimer.current);
      completionTimer.current = null;
    }
  }, []);

  const completeIntro = useCallback(() => {
    if (hasCompleted.current) return;

    hasCompleted.current = true;
    clearCompletionTimer();
    setIsLeaving(true);
    window.setTimeout(onComplete, FADE_DURATION_MS);
  }, [clearCompletionTimer, onComplete]);

  const startVisibleIntro = useCallback(() => {
    if (hasCompleted.current || document.visibilityState !== "visible") return;

    clearCompletionTimer();

    const video = videoRef.current;
    if (video) {
      const source = window.matchMedia("(max-width: 767px)").matches
        ? "/reevu-intro-mobile.mp4"
        : "/reevu-intro.mp4";

      if (video.getAttribute("src") !== source) {
        video.setAttribute("src", source);
        video.load();
      }

      video.currentTime = 0;
      void video.play().catch(() => {
        // The poster remains visible until the fixed intro timer completes.
      });
    }

    completionTimer.current = window.setTimeout(
      completeIntro,
      VISIBLE_DURATION_MS,
    );
  }, [clearCompletionTimer, completeIntro]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        clearCompletionTimer();
        videoRef.current?.pause();
        return;
      }

      startVisibleIntro();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startVisibleIntro();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearCompletionTimer();
    };
  }, [clearCompletionTimer, startVisibleIntro]);

  return (
    <div
      className={`intro-video-screen${isLeaving ? " intro-video-screen--leaving" : ""}`}
      aria-label="Reevu introduction"
    >
      <video
        ref={videoRef}
        className="intro-video"
        autoPlay
        muted
        playsInline
        preload="auto"
        poster="/reevu-logo-fixed.png"
      />
    </div>
  );
}
