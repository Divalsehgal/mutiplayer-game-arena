import { useEffect } from "react";

const APP_NAME = "Game Arena";

/** Sets the document title and meta description, restoring them on unmount. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} · ${APP_NAME}`;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    const previousDescription = meta.content;
    if (description) meta.content = description;

    return () => {
      document.title = previousTitle;
      if (created) meta?.remove();
      else if (meta) meta.content = previousDescription;
    };
  }, [title, description]);
}
