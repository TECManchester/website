"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { HeroSlide } from "@/lib/church";
import { cn } from "@/lib/utils";

const SLIDE_MS = 6500;
const FADE_MS = 1200;

/**
 * Background slideshow for the homepage hero.
 *
 * The headline never changes — only the imagery behind it. That keeps the
 * page's one <h1> stable for SEO and screen readers, avoids layout shift, and
 * means the message can't be missed by someone who arrives mid-rotation.
 *
 * With no slides supplied it renders the gradient alone, so the hero works
 * before any photography exists.
 */
export function HeroSlideshow({ slides }: { slides: readonly HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Auto-advance. Never runs for a single slide, when paused, or when the user
  // has asked for reduced motion.
  useEffect(() => {
    if (slides.length < 2 || paused || reduceMotion) return;

    const tick = () => setIndex((n) => (n + 1) % slides.length);
    timer.current = setTimeout(tick, SLIDE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, paused, reduceMotion, slides.length]);

  // Don't burn cycles rotating a hero nobody is looking at.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const hasSlides = slides.length > 0;

  return (
    <>
      {/* Images */}
      <div className="absolute inset-0" aria-hidden={!hasSlides}>
        {hasSlides ? (
          slides.map((slide, i) => (
            <div
              key={slide.src}
              className={cn(
                "absolute inset-0 transition-opacity ease-in-out",
                i === index ? "opacity-100" : "opacity-0",
              )}
              style={{ transitionDuration: `${reduceMotion ? 0 : FADE_MS}ms` }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                // Full-bleed at every breakpoint.
                sizes="100vw"
                // First slide is the LCP element; the second is next up.
                priority={i === 0}
                loading={i <= 1 ? "eager" : "lazy"}
                // 90, not the default 75. Must also be listed in
                // images.qualities in next.config or the optimiser 400s.
                quality={90}
                className={cn(
                  "object-cover",
                  // Focal point keeps the subject in frame as the crop
                  // narrows on phones.
                  slide.focal ?? "object-center",
                  !reduceMotion &&
                    i === index &&
                    "motion-safe:animate-[kenburns_9s_ease-out_forwards]",
                )}
              />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_-10%,#26265c_0%,transparent_55%),radial-gradient(ellipse_at_90%_110%,#1a1a3f_0%,transparent_50%)]" />
        )}
      </div>

      {/*
       * Scrims.
       *
       * Images supplied with a gradient already burned in only need a light
       * touch — stacking a second full-strength wash over them darkens the
       * subject, not just the background. Untreated images get the full
       * left-to-right wash so the headline stays legible.
       *
       * The bottom-up wash applies either way: on phones the crop is portrait
       * and the text sits over the middle of the photo, where no left-to-right
       * gradient can help.
       */}
      {hasSlides && (
        <>
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 bg-linear-to-r to-transparent",
              slides[index]?.preTreated
                ? "from-ink/45 via-ink/10"
                : "from-ink/95 via-ink/70",
            )}
          />
          <div
            aria-hidden
            className="from-ink absolute inset-0 bg-linear-to-t via-transparent to-transparent opacity-90 sm:opacity-55"
          />
        </>
      )}

    </>
  );
}
