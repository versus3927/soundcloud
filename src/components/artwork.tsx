import { AudioWaveform } from "lucide-react";
import { cn } from "@/lib/utils";

/** Track artwork with green-gradient fallback. */
export function Artwork({
  src,
  alt,
  size,
  className,
  spinning,
}: {
  src: string | null | undefined;
  alt: string;
  size: number;
  className?: string;
  spinning?: boolean;
}) {
  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn(
          "grid place-items-center bg-gradient-to-br from-accent-soft via-surface to-elev text-accent/70",
          className,
        )}
        aria-label={alt}
      >
        <AudioWaveform size={Math.max(14, size / 3)} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={cn("object-cover", className, spinning && "spin-slow")}
    />
  );
}
