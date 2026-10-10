import { useEffect, useState } from "react";
import { keyboardInset } from "@/utils/keyboard";

/**
 * Keeps forms usable with the iOS keyboard: publishes the keyboard height as the CSS variable --keyboard-inset
 * (used to lift sticky CTAs above the keyboard) and scrolls the focused field into view.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;
    const update = () => {
      const next = vv ? keyboardInset(window.innerHeight, vv.height, vv.offsetTop) : 0;
      setInset(next);
      root.style.setProperty("--keyboard-inset", `${next}px`);
    };
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el || !el.matches("input, textarea, select")) return;
      // wait for the keyboard animation, then keep the field visible above it
      window.setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
    };
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    document.addEventListener("focusin", onFocus);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      document.removeEventListener("focusin", onFocus);
      root.style.removeProperty("--keyboard-inset");
    };
  }, []);

  return inset;
}
