"use client";
import { Photo } from "@/components/photo";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { PromoSlide } from "@/types";
// Home page slider. Slides are rows in promo_slides, managed in Admin → Promo slides.
export function Carousel({ slides }: { slides: PromoSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 5500);
    return () => clearInterval(timer);
  }, [paused, count]);
  if (!count) return null;
  const go = (step: number) => setIndex((i) => (i + step + count) % count);
  return (
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-label="Promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`slide${i === index ? " is-active" : ""}`}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${count}`}
          aria-hidden={i !== index}
        >
          {/* The first slide is the first thing on the page; the others load when needed. */}
          <Photo src={s.image_url} alt="" width={1920} height={900} sizes="100vw" eager={i === 0} />
          <div className="container slide-copy">
            {s.title && <h2>{s.title}</h2>}
            {s.subtitle && <p>{s.subtitle}</p>}
            {s.button_label && (
              <Link className="button" href={s.link_url} tabIndex={i === index ? 0 : -1}>
                {s.button_label} <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      ))}
      {count > 1 && (
        <>
          <button
            className="carousel-arrow prev"
            aria-label="Previous slide"
            onClick={() => go(-1)}
          >
            <ChevronLeft />
          </button>
          <button className="carousel-arrow next" aria-label="Next slide" onClick={() => go(1)}>
            <ChevronRight />
          </button>
          <div className="carousel-dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                className={i === index ? "active" : ""}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
