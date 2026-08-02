"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

/**
 * Consent for third-party embeds.
 *
 * This site sets no cookies of its own on the public pages, runs no analytics
 * and no advertising. The one thing that reaches a third party is an embedded
 * Google map or YouTube player — loading either hands the visitor's IP address
 * and browser details to Google before they've asked for anything.
 *
 * So that is the only thing there is to consent to, and it's what the banner
 * asks about. A banner claiming we track people would be untrue, and the ICO
 * is explicit that consent requests must describe what actually happens.
 *
 * The preference itself is kept in localStorage rather than a cookie: it's
 * needed to honour a choice the visitor has made, which is exempt, and it never
 * leaves the device.
 */

export type ConsentValue = "granted" | "declined";

type ConsentState = {
  /** null means "not chosen yet" (or not yet read on the client). */
  embeds: ConsentValue | null;
  /** False during SSR and the first paint, so nothing flashes. */
  ready: boolean;
  grant: () => void;
  decline: () => void;
  reset: () => void;
};

const STORAGE_KEY = "ecm.consent.embeds";
const EVENT = "ecm:consent-changed";

/* ------------------------------------------------------------------ */
/* External store                                                      */
/*                                                                     */
/* localStorage is state that lives outside React, so it's read through */
/* useSyncExternalStore rather than an effect. That keeps the server    */
/* render and the first client render consistent, and avoids setting    */
/* state during an effect just to learn what the browser already knows. */
/* ------------------------------------------------------------------ */

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  // Keeps two open tabs in step.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStored(): ConsentValue | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "declined" ? value : null;
  } catch {
    // Private browsing can throw on storage access.
    return null;
  }
}

/** Server render has no storage and no client, so: nothing chosen, not ready. */
const serverSnapshot = () => null;
const noopSubscribe = () => () => {};

const ConsentContext = createContext<ConsentState | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const embeds = useSyncExternalStore(subscribe, readStored, serverSnapshot);

  // False on the server and during hydration, true once running in the browser.
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const write = useCallback((value: ConsentValue | null) => {
    try {
      if (value) window.localStorage.setItem(STORAGE_KEY, value);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore — the choice simply won't persist beyond this page.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const value = useMemo<ConsentState>(
    () => ({
      embeds,
      ready,
      grant: () => write("granted"),
      decline: () => write("declined"),
      reset: () => write(null),
    }),
    [embeds, ready, write],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentState {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    // Rendered outside the provider (shouldn't happen) — fail closed.
    return {
      embeds: null,
      ready: true,
      grant: () => {},
      decline: () => {},
      reset: () => {},
    };
  }
  return ctx;
}
