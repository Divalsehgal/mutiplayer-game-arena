import { useEffect } from "react";

const APP_NAME = "Game Arena";
const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, "");

interface PageMeta {
  title: string;
  description?: string;
  /** Path for the canonical URL, e.g. "/sudoku". */
  path?: string;
  /** Keep private or per-user pages (rooms, games, login) out of search results. */
  noindex?: boolean;
}

function upsert(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(selector);
  const created = !el;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  const previous = el.getAttribute(attr);
  el.setAttribute(attr, value);
  return () => {
    if (created) el?.remove();
    else if (previous !== null) el?.setAttribute(attr, previous);
  };
}

const metaTag = (key: "name" | "property", name: string) => () => {
  const el = document.createElement("meta");
  el.setAttribute(key, name);
  return el;
};

/** Sets title, description, canonical, robots and Open Graph tags, restoring them on unmount. */
export function usePageMeta({ title, description, path, noindex }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    const fullTitle = title === APP_NAME ? title : `${title} · ${APP_NAME}`;
    document.title = fullTitle;

    const restore = [
      upsert('meta[property="og:title"]', metaTag("property", "og:title"), "content", fullTitle),
      upsert('meta[name="robots"]', metaTag("name", "robots"), "content", noindex ? "noindex, nofollow" : "index, follow"),
    ];
    if (description) {
      restore.push(
        upsert('meta[name="description"]', metaTag("name", "description"), "content", description),
        upsert('meta[property="og:description"]', metaTag("property", "og:description"), "content", description),
      );
    }
    if (path !== undefined) {
      const url = `${SITE_URL}${path}`;
      restore.push(
        upsert('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }), "href", url),
        upsert('meta[property="og:url"]', metaTag("property", "og:url"), "content", url),
      );
    }

    return () => {
      document.title = previousTitle;
      restore.forEach((fn) => fn());
    };
  }, [title, description, path, noindex]);
}
