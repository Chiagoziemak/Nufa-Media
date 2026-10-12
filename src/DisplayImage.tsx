import type { CSSProperties } from "react";
import type { ImageColorMode, ImageValue } from "./types";

interface DisplayImageProps {
  image?: ImageValue;
  fallbackSrc?: string;
  fallbackAlt?: string;
  defaultColorMode?: ImageColorMode;
  className?: string;
  loading?: "lazy" | "eager";
  style?: CSSProperties;
}

export function DisplayImage({
  image,
  fallbackSrc,
  fallbackAlt = "",
  defaultColorMode = "colour",
  className,
  loading,
  style,
}: DisplayImageProps) {
  const colorMode = image?.colorMode ?? defaultColorMode;
  return (
    <img
      src={image?.asset?.url || fallbackSrc}
      alt={image?.alt || fallbackAlt}
      className={className}
      loading={loading}
      style={{
        ...style,
        filter: colorMode === "blackAndWhite" ? "grayscale(1)" : "none",
      }}
    />
  );
}
