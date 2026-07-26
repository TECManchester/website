"use client";

import { useEffect } from "react";

/**
 * Scroll-reveal for elements carrying `.reveal`.
 *
 * Sets `data-reveal-ready` on <html> first, so the CSS that hides content only
 * applies once this is running. Without JS — or before hydration — everything
 * stays visible rather than blank.
 */
export function RevealProvider() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const root = document.documentElement;
    root.dataset.revealReady = "true";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    const observeAll = () => {
      for (const el of document.querySelectorAll(".reveal:not(.is-visible)")) {
        observer.observe(el);
      }
    };
    observeAll();

    // Client-side navigation swaps the DOM without remounting this provider.
    const mutation = new MutationObserver(observeAll);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
      delete root.dataset.revealReady;
    };
  }, []);

  return null;
}
