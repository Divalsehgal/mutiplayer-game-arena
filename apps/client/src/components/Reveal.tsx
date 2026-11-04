import { useEffect, useRef, useState, type ReactNode } from "react";

const STEP_MS = 80;

interface RevealProps {
  children: ReactNode;
  /** Position in the section's stagger: heading 0, text 1, picture 2. */
  order?: number;
  className?: string;
  /** Animate on mount instead of on scroll, for the first screen. */
  immediate?: boolean;
}

/**
 * Rises and fades in once as it enters the viewport (the `.reveal` styles in global.css).
 * Plain CSS and IntersectionObserver so the public pages don't pull framer-motion into the main bundle.
 */
export function Reveal({ children, order = 0, className = "", immediate = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Without IntersectionObserver (old browsers, jsdom) the content is simply shown.
  const [shown, setShown] = useState(typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (shown || !ref.current) return;
    if (immediate) {
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true);
        observer.disconnect();
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shown, immediate]);

  return (
    <div ref={ref} data-shown={shown} className={`reveal ${className}`} style={{ transitionDelay: `${order * STEP_MS}ms` }}>
      {children}
    </div>
  );
}
