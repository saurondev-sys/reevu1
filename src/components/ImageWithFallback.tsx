import { useState, type ImgHTMLAttributes } from "react";
import { Film, UserRound } from "lucide-react";

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: "poster" | "person" | "backdrop";
}

export default function ImageWithFallback({
  src,
  alt,
  className,
  fallbackType = "poster",
  ...props
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-900 text-zinc-600 ${className ?? ""}`}
        role="img"
        aria-label={alt}
      >
        {fallbackType === "person" ? (
          <UserRound className="h-12 w-12" />
        ) : (
          <Film className="h-12 w-12" />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
