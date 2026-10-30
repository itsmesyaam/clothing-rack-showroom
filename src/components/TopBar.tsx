import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { BRAND } from "../config/brand";
import { FOCUS } from "./ui";

interface Props {
  cartCount: number;
  user: string | null;
  menuOpen: boolean;
  inDetail: boolean;
  onMenu(): void;
  onLogo(): void;
  onAccount(): void;
  onCart(): void;
}

const TEXT_BTN = `pointer-events-auto h-11 cursor-pointer items-center rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-60 ${FOCUS}`;

/** Floats over the stage: empty areas pass pointer events through, so the rack can still be dragged up here. */
export function TopBar({ cartCount, user, menuOpen, inDetail, onMenu, onLogo, onAccount, onCart }: Props) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between px-2 md:px-5">
      <button
        type="button"
        aria-label="Menu"
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        onClick={onMenu}
        className={`pointer-events-auto grid size-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-black/5 ${FOCUS}`}
      >
        <Menu aria-hidden size={20} strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={onLogo}
        aria-label={inDetail ? `${BRAND.name}, back to the rack` : `${BRAND.name}, home`}
        className={`group pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer p-2 ${FOCUS}`}
      >
        <span className="block -rotate-3 transition-transform duration-300 group-hover:rotate-0">
          <span className="block -skew-x-12 border border-ink bg-neon px-4 py-1.5 shadow-[3px_3px_0_0_var(--color-ink)]">
            <span className="block skew-x-12 text-[15px] font-black italic leading-none tracking-tight text-ink md:text-lg">
              {BRAND.name}
            </span>
          </span>
        </span>
      </button>

      <div className="flex items-center">
        <button type="button" aria-haspopup="dialog" onClick={onAccount} className={`hidden sm:inline-flex ${TEXT_BTN}`}>
          {user ? "Account" : "Sign in"}
        </button>
        <button
          type="button"
          aria-haspopup="dialog"
          aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
          onClick={onCart}
          className={`inline-flex ${TEXT_BTN}`}
        >
          Cart (<motion.span
            key={cartCount}
            className="inline-block tabular-nums"
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 26 }}
          >{cartCount}</motion.span>)
        </button>
      </div>
    </header>
  );
}
