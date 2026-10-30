import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { BRAND } from "../config/brand";
import type { Product } from "../data/products";
import { useDialog } from "../hooks/useDialog";
import { formatPrice, pad2 } from "../lib/util";
import { FADE, FOCUS, RoundButton, SHEET } from "./ui";

interface Props {
  open: boolean;
  products: Product[];
  activeIndex: number | null;
  cartCount: number;
  user: string | null;
  onJump(index: number): void;
  onBag(): void;
  onAccount(): void;
  onClose(): void;
}

const SAFE = { paddingBottom: "max(16px, env(safe-area-inset-bottom))" };

export function MenuDrawer({ open, products, activeIndex, cartCount, user, onJump, onBag, onAccount, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  useDialog(open, panel, onClose);

  return (
    <AnimatePresence>
      {open && (
        <div key="menu" className="fixed inset-0 z-50">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-black/25"
            variants={FADE}
            initial="hidden"
            animate="shown"
            exit="hidden"
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-full max-w-[400px] flex-col bg-[#fbfbf9] shadow-2xl"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={SHEET}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 pl-5 pr-2">
              <span className="text-sm font-black italic tracking-tight">{BRAND.name}</span>
              <RoundButton label="Close menu" onClick={onClose}>
                <X aria-hidden size={18} />
              </RoundButton>
            </div>

            <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/60">On the rack</h2>
              <ol className="mt-3">
                {products.map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onJump(i)}
                      aria-current={activeIndex === i ? "true" : undefined}
                      className={`group flex min-h-12 w-full cursor-pointer items-center gap-4 border-b border-black/10 py-2 text-left ${FOCUS}`}
                    >
                      <span className="w-6 text-[11px] tabular-nums text-black/60">{pad2(i + 1)}</span>
                      <span className="flex-1 text-[13px] font-semibold uppercase tracking-[0.12em] underline-offset-4 group-hover:underline group-aria-[current=true]:underline">
                        {p.title}
                      </span>
                      <span className="text-xs tabular-nums text-black/60">{formatPrice(p.price)}</span>
                    </button>
                  </li>
                ))}
              </ol>

              <div className="mt-8">
                <MenuLink onClick={onBag}>Bag ({cartCount})</MenuLink>
                <MenuLink onClick={onAccount}>{user ? "Account" : "Sign in"}</MenuLink>
              </div>
            </nav>

            <p className="shrink-0 border-t border-black/10 px-5 pt-4 text-[11px] uppercase tracking-[0.2em] text-black/60" style={SAFE}>
              © {new Date().getFullYear()} {BRAND.name} · {BRAND.studio}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function MenuLink({ onClick, children }: { onClick(): void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={onClick}
      className={`flex h-12 w-full cursor-pointer items-center text-left text-lg font-semibold uppercase tracking-[0.08em] transition-opacity hover:opacity-60 ${FOCUS}`}
    >
      {children}
    </button>
  );
}
