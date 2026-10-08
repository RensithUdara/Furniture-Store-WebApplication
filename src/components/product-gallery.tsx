"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Play, X, ZoomIn, ZoomOut } from "lucide-react";
import { videoSource } from "@/lib/video";
import { Photo } from "@/components/photo";
import type { ProductImage } from "@/types";
type Media =
  | { kind: "image"; key: string; src: string }
  | { kind: "youtube"; key: string; src: string; poster: string }
  | { kind: "file"; key: string; src: string; poster: string };
// The product photos (and video, when there is one). Moving the pointer over a photo zooms
// into that spot; clicking opens a full-screen viewer with arrows, thumbnails and zoom.
export function ProductGallery({
  name,
  images,
  video = "",
}: {
  name: string;
  images: ProductImage[];
  video?: string;
}) {
  const photos = images.length ? images : [{ id: "none", image_url: "/images/living.jpg" }];
  const source = video ? videoSource(video) : null;
  const media: Media[] = [
    ...photos.map((i) => ({ kind: "image" as const, key: i.id, src: i.image_url })),
    ...(source
      ? [
          source.kind === "youtube"
            ? { kind: "youtube" as const, key: "video", src: source.embed, poster: source.poster }
            : { kind: "file" as const, key: "video", src: source.src, poster: photos[0].image_url },
        ]
      : []),
  ];
  const [at, setAt] = useState(0),
    [full, setFull] = useState(false),
    [zoomed, setZoomed] = useState(false),
    [origin, setOrigin] = useState("50% 50%"),
    [hover, setHover] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    touch = useRef(0);
  const current = media[Math.min(at, media.length - 1)];
  const step = (by: number) => {
    setZoomed(false);
    setAt((i) => (i + by + media.length) % media.length);
  };
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (full && !d.open) d.showModal();
    if (!full && d.open) d.close();
  }, [full]);
  const point = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(
      `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
    );
  };
  const label = (m: Media, i: number) =>
    m.kind === "image" ? `View image ${i + 1}` : "Play the product video";
  const player = (m: Media) =>
    m.kind === "youtube" ? (
      <iframe
        src={m.src}
        title={`${name} video`}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
      />
    ) : (
      <video src={m.src} poster={m.kind === "file" ? m.poster : undefined} controls playsInline />
    );
  return (
    <div className="gallery">
      <div className={`main-photo${current.kind === "image" ? " can-zoom" : " is-video"}`}>
        {current.kind === "image" ? (
          <button
            type="button"
            aria-label={`Open ${name} image ${at + 1} full screen`}
            onClick={() => setFull(true)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onMouseMove={point}
          >
            <Photo
              src={current.src}
              alt={`${name}, image ${at + 1}`}
              width={1000}
              height={1000}
              // Shown at up to half the page, and zoomed to twice that on hover.
              sizes="(max-width: 900px) 100vw, 1000px"
              eager={at === 0}
              style={hover ? { transform: "scale(2)", transformOrigin: origin } : undefined}
            />
            <span className="zoom-hint">
              <Expand size={15} /> Click to enlarge
            </span>
          </button>
        ) : (
          player(current)
        )}
      </div>
      {media.length > 1 && (
        <div className="thumbnails">
          {media.map((m, i) => (
            <button
              key={m.key}
              className={at === i ? "selected" : ""}
              onClick={() => setAt(i)}
              aria-label={label(m, i)}
              aria-pressed={at === i}
            >
              <Photo
                src={m.kind === "image" ? m.src : m.poster}
                alt=""
                width={160}
                height={160}
                sizes="80px"
              />
              {m.kind !== "image" && (
                <span className="thumb-play">
                  <Play size={18} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={`${name} gallery`}
        onClose={() => {
          setFull(false);
          setZoomed(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
      >
        {full && (
          <>
            <header>
              <span>
                {at + 1} / {media.length}
              </span>
              {current.kind === "image" && (
                <button
                  type="button"
                  aria-label={zoomed ? "Zoom out" : "Zoom in"}
                  onClick={() => setZoomed(!zoomed)}
                >
                  {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                </button>
              )}
              <button type="button" aria-label="Close gallery" onClick={() => setFull(false)}>
                <X size={22} />
              </button>
            </header>
            <div
              className={`lightbox-stage${zoomed ? " is-zoomed" : ""}`}
              onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
              onTouchEnd={(e) => {
                const moved = e.changedTouches[0].clientX - touch.current;
                if (!zoomed && Math.abs(moved) > 50) step(moved < 0 ? 1 : -1);
              }}
            >
              {current.kind === "image" ? (
                <img
                  src={current.src}
                  alt={`${name}, image ${at + 1}`}
                  style={zoomed ? { transform: "scale(2.5)", transformOrigin: origin } : undefined}
                  onClick={(e) => {
                    point(e);
                    setZoomed(!zoomed);
                  }}
                  onMouseMove={(e) => zoomed && point(e)}
                />
              ) : (
                player(current)
              )}
              {media.length > 1 && (
                <>
                  <button
                    type="button"
                    className="lightbox-arrow prev"
                    aria-label="Previous"
                    onClick={() => step(-1)}
                  >
                    <ChevronLeft size={26} />
                  </button>
                  <button
                    type="button"
                    className="lightbox-arrow next"
                    aria-label="Next"
                    onClick={() => step(1)}
                  >
                    <ChevronRight size={26} />
                  </button>
                </>
              )}
            </div>
            {media.length > 1 && (
              <div className="lightbox-thumbs">
                {media.map((m, i) => (
                  <button
                    type="button"
                    key={m.key}
                    className={at === i ? "selected" : ""}
                    aria-label={label(m, i)}
                    aria-pressed={at === i}
                    onClick={() => {
                      setZoomed(false);
                      setAt(i);
                    }}
                  >
                    <img src={m.kind === "image" ? m.src : m.poster} alt="" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </dialog>
    </div>
  );
}
