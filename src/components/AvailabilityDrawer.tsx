import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Minus, Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type Dispatch, type FormEvent } from "react";
import { SIZES, stockFor, type Product } from "../data/products";
import { GarmentArt } from "../garment/GarmentArt";
import { useDialog } from "../hooks/useDialog";
import { formatPrice } from "../lib/util";
import type { CartAction, CartLine } from "../state/cart";
import { FADE, FOCUS, RoundButton, SHEET } from "./ui";

export type Pane = "product" | "bag" | "account";

const SAFE = { paddingBottom: "max(20px, env(safe-area-inset-bottom))" };
const LABEL = "text-[11px] font-semibold uppercase tracking-[0.2em]";
const LINK = `inline-flex h-11 cursor-pointer items-center text-[11px] font-semibold uppercase tracking-[0.2em] underline decoration-1 underline-offset-[6px] hover:decoration-2 ${FOCUS}`;
const CHECKED_RING =
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink";

function PrimaryButton({ className = "", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-ink text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/45 disabled:hover:opacity-100 ${FOCUS} ${className}`}
    >
      {children}
    </button>
  );
}

interface Props {
  open: boolean;
  pane: Pane;
  product: Product;
  colorId: string;
  products: Product[];
  cart: CartLine[];
  user: string | null;
  notice: string | null;
  dispatch: Dispatch<CartAction>;
  onPane(pane: Pane): void;
  onSelectColor(colorId: string): void;
  onSignIn(email: string): void;
  onSignOut(): void;
  onCheckout(): void;
  onClose(): void;
}

/** One slide-over, three panes: size availability → bag → sign in. */
export function AvailabilityDrawer({
  open, pane, product, colorId, products, cart, user, notice, dispatch,
  onPane, onSelectColor, onSignIn, onSignOut, onCheckout, onClose,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const [added, setAdded] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setAdded(null);
  }
  useDialog(open, panel, onClose);

  // Switching panes inside the drawer moves focus to the (persistent) title.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    title.current?.focus({ preventScroll: true });
  }, [pane]);
  const go = (p: Pane) => {
    moveFocus.current = true;
    onPane(p);
  };

  const count = cart.reduce((n, l) => n + l.qty, 0);
  const heading = pane === "product" ? "Availability" : pane === "bag" ? `Bag (${count})` : user ? "Account" : "Sign in";

  return (
    <AnimatePresence>
      {open && (
        <div key="drawer" className="fixed inset-0 z-50">
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
            aria-labelledby="drawer-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-[#fbfbf9] shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SHEET}
          >
            <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 pl-5 pr-2">
              <h2 id="drawer-title" ref={title} tabIndex={-1} data-autofocus className={`${LABEL} outline-none`}>
                {heading}
              </h2>
              <RoundButton label="Close" onClick={onClose}>
                <X aria-hidden size={18} />
              </RoundButton>
            </header>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pane}
                className="flex min-h-0 flex-1 flex-col"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                {pane === "product" && (
                  <ProductPane
                    product={product}
                    colorId={colorId}
                    cart={cart}
                    dispatch={dispatch}
                    onSelectColor={onSelectColor}
                    onAdded={(msg) => {
                      setAdded(msg);
                      go("bag");
                    }}
                  />
                )}
                {pane === "bag" && (
                  <BagPane
                    cart={cart}
                    products={products}
                    added={added}
                    notice={notice}
                    dispatch={dispatch}
                    onCheckout={onCheckout}
                    onBrowse={onClose}
                  />
                )}
                {pane === "account" && <AccountPane user={user} onSignIn={onSignIn} onSignOut={onSignOut} />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── availability ── */

interface ProductPaneProps {
  product: Product;
  colorId: string;
  cart: CartLine[];
  dispatch: Dispatch<CartAction>;
  onSelectColor(colorId: string): void;
  onAdded(message: string): void;
}

function ProductPane({ product, colorId, cart, dispatch, onSelectColor, onAdded }: ProductPaneProps) {
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const [picked, setPicked] = useState<string | null>(null);
  const stock = (size: string) => stockFor(product.id, color.id, size);
  // A size that's sold out in the newly chosen colour simply drops its selection.
  const size = picked && stock(picked) > 0 ? picked : null;
  const inBag = size ? (cart.find((l) => l.key === `${product.id}:${color.id}:${size}`)?.qty ?? 0) : 0;
  const left = size ? Math.min(stock(size), 9) - inBag : 0;
  const status = !size
    ? ""
    : left <= 0
      ? `All available ${size} are in your bag.`
      : left <= 2
        ? `Only ${left} left in ${size}.`
        : `In stock in ${size}.`;

  const add = () => {
    if (!size || left <= 0) return;
    dispatch({ type: "add", productId: product.id, colorId: color.id, size });
    onAdded(`${product.title} — ${color.name}, ${size}`);
  };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6">
        <div className="flex gap-4">
          <div className="h-28 w-[84px] shrink-0 rounded-xl bg-black/[0.035] p-1.5">
            <GarmentArt product={product} color={color} className="size-full" />
          </div>
          <div className="min-w-0 pt-1">
            <p className="text-[13px] font-semibold uppercase leading-snug tracking-[0.12em]">{product.title}</p>
            <p className="mt-1 text-[13px] tabular-nums text-black/70">{formatPrice(product.price)}</p>
          </div>
        </div>

        <fieldset className="mt-7">
          <legend className={LABEL}>
            Colour <span className="font-medium text-black/60">— {color.name}</span>
          </legend>
          <div className="mt-2 flex gap-1">
            {product.colors.map((c) => (
              <label
                key={c.id}
                className={`grid size-11 cursor-pointer place-items-center rounded-full has-[:checked]:ring-2 has-[:checked]:ring-ink ${CHECKED_RING}`}
              >
                <input
                  type="radio"
                  name="colour"
                  value={c.id}
                  checked={c.id === color.id}
                  onChange={() => onSelectColor(c.id)}
                  aria-label={c.name}
                  className="sr-only"
                />
                <span className="size-8 rounded-full border border-black/15" style={{ background: c.hex }} />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className={LABEL}>Size</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SIZES.map((s) => {
              const n = stock(s);
              const out = n === 0;
              return (
                <label
                  key={s}
                  className={`flex h-14 flex-col items-center justify-center rounded-xl border text-center transition-colors ${
                    out ? "cursor-not-allowed border-black/10 text-black/35" : "cursor-pointer border-black/15 hover:border-ink"
                  } has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white ${CHECKED_RING}`}
                >
                  <input
                    type="radio"
                    name="size"
                    value={s}
                    disabled={out}
                    checked={size === s}
                    onChange={() => setPicked(s)}
                    className="sr-only"
                  />
                  <span className={`text-[13px] font-semibold tracking-[0.1em] ${out ? "line-through" : ""}`}>{s}</span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.1em] opacity-70">
                    {out ? "Sold out" : n <= 2 ? `${n} left` : "In stock"}
                  </span>
                </label>
              );
            })}
          </div>
          <p aria-live="polite" className="mt-3 min-h-5 text-xs text-black/70">
            {status}
          </p>
        </fieldset>

        <section className="mt-6 border-t border-black/10 pt-5">
          <h3 className={LABEL}>Details</h3>
          <ul className="mt-3 space-y-1.5 text-[13px] leading-snug text-black/75">
            {product.details.map((d) => (
              <li key={d}>— {d}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="shrink-0 border-t border-black/10 px-5 pt-5" style={SAFE}>
        <PrimaryButton disabled={!size || left <= 0} onClick={add}>
          {!size ? "Select a size" : left <= 0 ? "All in your bag" : `Add to bag — ${formatPrice(product.price)}`}
        </PrimaryButton>
      </div>
    </>
  );
}

/* ── bag ── */

interface BagPaneProps {
  cart: CartLine[];
  products: Product[];
  added: string | null;
  notice: string | null;
  dispatch: Dispatch<CartAction>;
  onCheckout(): void;
  onBrowse(): void;
}

function BagPane({ cart, products, added, notice, dispatch, onCheckout, onBrowse }: BagPaneProps) {
  const [removed, setRemoved] = useState<CartLine | null>(null);
  const resolve = (l: CartLine) => {
    const p = products.find((x) => x.id === l.productId);
    const c = p?.colors.find((x) => x.id === l.colorId);
    return p && c ? { p, c } : null;
  };
  const rows = cart.flatMap((l) => {
    const r = resolve(l);
    return r ? [{ l, ...r }] : [];
  });
  const subtotal = rows.reduce((sum, r) => sum + r.p.price * r.l.qty, 0);
  const removedItem = removed ? resolve(removed) : null;

  const remove = (l: CartLine) => {
    dispatch({ type: "remove", key: l.key });
    setRemoved(l);
  };
  const undo = () => {
    if (!removed) return;
    for (let i = 0; i < removed.qty; i++) {
      dispatch({ type: "add", productId: removed.productId, colorId: removed.colorId, size: removed.size });
    }
    setRemoved(null);
  };

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        <div aria-live="polite">
          {removed && removedItem ? (
            <p className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-black/[0.04] px-4 text-xs">
              <span>
                Removed {removedItem.p.title}, {removed.size}.
              </span>
              <button type="button" onClick={undo} className={LINK}>
                Undo
              </button>
            </p>
          ) : added ? (
            <p className="flex min-h-11 items-center gap-2 rounded-xl bg-black/[0.04] px-4 text-xs">
              <Check aria-hidden size={14} strokeWidth={2.5} />
              Added {added}
            </p>
          ) : null}
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em]">Your bag is empty</p>
            <p className="mt-2 text-sm text-black/60">Pick something off the rack.</p>
            <button type="button" onClick={onBrowse} className={`mt-3 ${LINK}`}>
              Back to the rack
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-black/10">
            {rows.map(({ l, p, c }) => {
              const max = Math.min(stockFor(p.id, c.id, l.size), 9);
              return (
                <li key={l.key} className="flex gap-4 py-4">
                  <div className="h-[84px] w-[63px] shrink-0 rounded-lg bg-black/[0.035] p-1">
                    <GarmentArt product={p} color={c} className="size-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold uppercase leading-snug tracking-[0.12em]">{p.title}</p>
                      <p className="text-xs tabular-nums">{formatPrice(p.price * l.qty)}</p>
                    </div>
                    <p className="mt-1 text-xs text-black/60">
                      {c.name} · {l.size}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div role="group" aria-label={`Quantity, ${p.title}`} className="flex items-center">
                        <RoundButton
                          label={`Decrease quantity of ${p.title}`}
                          disabled={l.qty <= 1}
                          onClick={() => dispatch({ type: "dec", key: l.key })}
                        >
                          <Minus aria-hidden size={14} />
                        </RoundButton>
                        <span className="w-8 text-center text-xs tabular-nums">{l.qty}</span>
                        <RoundButton
                          label={`Increase quantity of ${p.title}`}
                          disabled={l.qty >= max}
                          onClick={() => dispatch({ type: "inc", key: l.key })}
                        >
                          <Plus aria-hidden size={14} />
                        </RoundButton>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(l)}
                        className={`h-11 cursor-pointer text-[11px] font-semibold uppercase tracking-[0.16em] text-black/60 underline underline-offset-4 hover:text-ink ${FOCUS}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {rows.length > 0 && (
        <div className="shrink-0 border-t border-black/10 px-5 pt-5" style={SAFE}>
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-semibold uppercase tracking-[0.14em]">Subtotal</span>
            <span className="tabular-nums">{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-black/60">Shipping and taxes are calculated at checkout.</p>
          <PrimaryButton className="mt-4" onClick={onCheckout}>
            Checkout
            <ArrowRight aria-hidden size={14} />
          </PrimaryButton>
          <p aria-live="polite" className="mt-2 min-h-4 text-center text-xs text-black/70">
            {notice}
          </p>
          <div className="text-center">
            <button type="button" onClick={onBrowse} className={LINK}>
              Continue shopping
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── sign in ── */

function AccountPane({ user, onSignIn, onSignOut }: { user: string | null; onSignIn(email: string): void; onSignOut(): void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return (
      <div className="flex-1 px-5 py-6">
        <p className="text-sm text-black/70">Signed in as</p>
        <p className="mt-1 break-all text-[15px] font-semibold">{user}</p>
        <button type="button" onClick={onSignOut} className={`mt-5 ${LINK}`}>
          Sign out
        </button>
      </div>
    );
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const field = e.currentTarget.elements.namedItem("email") as HTMLInputElement;
    if (!field.checkValidity()) {
      setError("Enter an email address, like name@example.com.");
      field.focus();
      return;
    }
    onSignIn(email.trim());
  };

  return (
    <form noValidate onSubmit={submit} className="flex-1 px-5 py-6">
      <label htmlFor="account-email" className={LABEL}>
        Email
      </label>
      <input
        id="account-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(null);
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "account-email-error" : undefined}
        className="mt-2 h-12 w-full rounded-xl border border-black/20 bg-white px-4 text-base transition-colors focus:border-ink focus:outline-2 focus:outline-offset-2 focus:outline-ink aria-[invalid=true]:border-[#b42318]"
      />
      {error && (
        <p id="account-email-error" className="mt-2 text-xs text-[#b42318]">
          {error}
        </p>
      )}
      <PrimaryButton type="submit" className="mt-5">
        Sign in
      </PrimaryButton>
    </form>
  );
}
