import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Modal sheet behaviour: initial focus, Tab trap, Escape closes, focus restored on close. */
export function useDialog(open: boolean, panel: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const items = () => Array.from(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const raf = requestAnimationFrame(() => {
      (panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? items()[0])?.focus({ preventScroll: true });
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) return;
      const at = document.activeElement;
      const i = list.indexOf(at as HTMLElement);
      const inside = panel.current?.contains(at) ?? false;
      const wrap = e.shiftKey ? i <= 0 : i === list.length - 1 || !inside;
      if (wrap) {
        e.preventDefault();
        (e.shiftKey ? list[list.length - 1] : list[0]).focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      restore?.focus({ preventScroll: true });
    };
  }, [open, panel]);
}
