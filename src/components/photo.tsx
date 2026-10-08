import Image from "next/image";
import type { CSSProperties } from "react";
// The store's own images (bundled ones and Supabase Storage uploads) can be resized and
// converted by the server; see `images` in next.config.ts. A link to any other site is shown
// as it is.
const optimisable = (src: string) =>
  /^\/images\/[^?]+$/.test(src) ||
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(src);
// A storefront image. `width` and `height` give its shape (so the page does not jump while it
// loads) and `sizes` says how wide it is shown, so each screen downloads a file of the right
// size in a modern format. `eager` is for the first image a visitor sees on a page.
export function Photo({
  src,
  alt,
  sizes,
  width = 800,
  height = 800,
  eager = false,
  className,
  style,
}: {
  src: string;
  alt: string;
  sizes: string;
  width?: number;
  height?: number;
  eager?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const shared = {
    alt,
    width,
    height,
    className,
    style,
    loading: eager ? ("eager" as const) : ("lazy" as const),
    fetchPriority: eager ? ("high" as const) : undefined,
    decoding: "async" as const,
  };
  // eslint-disable-next-line @next/next/no-img-element
  if (!optimisable(src)) return <img src={src} {...shared} />;
  return <Image src={src} sizes={sizes} {...shared} />;
}
