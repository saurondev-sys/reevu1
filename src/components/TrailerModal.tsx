import { useEffect } from "react";
import { X } from "lucide-react";

interface TrailerModalProps {
  videoKey: string | null;
  title: string;
  onClose: () => void;
}

export default function TrailerModal({
  videoKey,
  title,
  onClose,
}: TrailerModalProps) {
  useEffect(() => {
    if (!videoKey) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, videoKey]);

  if (!videoKey) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-lg"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} trailer`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="truncate pr-4 font-medium text-white">{title} — Trailer</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close trailer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="aspect-video">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
            title={`${title} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
