import { useCallback, useEffect, useRef, useState } from "react";

type IntroVideoProps = {
  onComplete: () => void;
};

const FADE_DURATION_MS = 300;
const FALLBACK_DURATION_MS = 3500;

export default function IntroVideo({ onComplete }: IntroVideoProps) {
  const [isLeaving, setIsLeaving] = useState(false);
  const hasCompleted = useRef(false);
  const fallbackTimer = useRef<number | null>(null);

  const completeIntro = useCallback(() => {
    if (hasCompleted.current) return;

    hasCompleted.current = true;
    setIsLeaving(true);

    if (fallbackTimer.current !== null) {
      window.clearTimeout(fallbackTimer.current);
    }

    window.setTimeout(onComplete, FADE_DURATION_MS);
  }, [onComplete]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    fallbackTimer.current = window.setTimeout(
      completeIntro,
      FALLBACK_DURATION_MS,
    );

    return () => {
      document.body.style.overflow = previousOverflow;

      if (fallbackTimer.current !== null) {
        window.clearTimeout(fallbackTimer.current);
      }
    };
  }, [completeIntro]);

  return (
    <div
      className={`intro-video-screen${isLeaving ? " intro-video-screen--leaving" : ""}`}
      aria-label="Reevu introduction"
    >
      <video
        className="intro-video"
        src="/reevu-intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={completeIntro}
        onError={completeIntro}
      />
    </div>
  );
}
