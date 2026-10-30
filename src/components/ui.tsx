import type { ButtonHTMLAttributes } from "react";

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
export const SHEET = { type: "spring", stiffness: 320, damping: 36 } as const;
export const FADE = { hidden: { opacity: 0 }, shown: { opacity: 1 } };

export function RoundButton({
  label, className = "", children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      {...rest}
      className={`grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border border-black/15 transition-colors hover:border-ink hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-30 ${FOCUS} ${className}`}
    >
      {children}
    </button>
  );
}
