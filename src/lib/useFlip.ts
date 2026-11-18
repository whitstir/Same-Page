"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

// Animates list items sliding to their new place when the list is reordered
// (the "FLIP" technique). Give each item a stable key and pass `register(key)`
// as its ref; pass the current key order as `deps`.
export function useFlip(order: string[]) {
  const els = useRef(new Map<string, HTMLElement>());
  const tops = useRef(new Map<string, number>());

  const register = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) els.current.set(key, el);
      else els.current.delete(key);
    },
    [],
  );

  const orderKey = order.join("|");
  useLayoutEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    els.current.forEach((el, key) => {
      const top = el.getBoundingClientRect().top;
      next.set(key, top);
      const prev = tops.current.get(key);
      if (!reduce && prev !== undefined && Math.abs(prev - top) > 1) {
        el.animate([{ transform: `translateY(${prev - top}px)` }, { transform: "translateY(0)" }], {
          duration: 220,
          easing: "cubic-bezier(0.2, 0, 0, 1)",
        });
      }
    });
    tops.current = next;
  }, [orderKey]);

  return register;
}
