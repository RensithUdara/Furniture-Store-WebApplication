"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
// Shows a progress bar and spinner from the moment a link or form is used until the new page
// is on screen, so every click gets immediate feedback even when the server takes a while.
const NAVIGATION_START = "navigation:start";
// For navigations started in script (router.push), which no click or submit listener can see.
export function navigate(push: (url: string) => void, url: string) {
  const target = new URL(url, window.location.href);
  if (target.pathname + target.search !== window.location.pathname + window.location.search)
    document.dispatchEvent(new Event(NAVIGATION_START));
  push(url);
}
export function NavigationProgress() {
  const path = usePathname();
  const query = useSearchParams().toString();
  const [busy, setBusy] = useState(false);
  // The URL changed, so the navigation has finished.
  useEffect(() => setBusy(false), [path, query]);
  useEffect(() => {
    if (!busy) return;
    // Safety net: never leave the indicator up if a navigation is cancelled or fails.
    const timer = setTimeout(() => setBusy(false), 12000);
    return () => clearTimeout(timer);
  }, [busy]);
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (or only the #anchor differs): nothing will load.
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      setBusy(true);
    }
    function onSubmit(event: SubmitEvent) {
      const form = event.target as HTMLFormElement;
      // Only real page navigations; forms handled in script show their own "Saving…" state.
      if (!event.defaultPrevented && form.method === "get") setBusy(true);
    }
    // A page restored from the back/forward cache must not come back with the indicator showing.
    const reset = () => setBusy(false);
    const start = () => setBusy(true);
    document.addEventListener(NAVIGATION_START, start);
    // Capture phase: Next.js links cancel the default click, so listen before they handle it.
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    window.addEventListener("pageshow", reset);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit);
      document.removeEventListener(NAVIGATION_START, start);
      window.removeEventListener("pageshow", reset);
    };
  }, []);
  if (!busy) return null;
  return (
    <div className="nav-progress" aria-hidden="true">
      <div className="loader-bar" />
      <svg className="loader-rings" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" pathLength="100" strokeDasharray="78 22" />
        <circle cx="50" cy="50" r="33" pathLength="100" strokeDasharray="62 38" />
        <circle cx="50" cy="50" r="22" pathLength="100" strokeDasharray="45 55" />
      </svg>
    </div>
  );
}
