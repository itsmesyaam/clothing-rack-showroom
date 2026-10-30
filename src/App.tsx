import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AvailabilityDrawer, type Pane } from "./components/AvailabilityDrawer";
import { DetailView } from "./components/DetailView";
import { Marquee } from "./components/Marquee";
import { MenuDrawer } from "./components/MenuDrawer";
import { Rack, type RackHandle } from "./components/Rack";
import { StudioBackdrop } from "./components/StudioBackdrop";
import { TopBar } from "./components/TopBar";
import { BRAND } from "./config/brand";
import { PRODUCTS, type Product } from "./data/products";
import { SvgDefs } from "./garment/SvgDefs";
import { useViewport } from "./hooks/useViewport";
import { rackLayout } from "./lib/layout";
import { cartReducer, type CartLine } from "./state/cart";

const CART_KEY = "overhang.cart.v1";

/** Restore the bag, dropping anything that no longer matches the catalogue. */
function loadCart(): CartLine[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return (raw as CartLine[]).filter((l) => {
      const p = PRODUCTS.find((x) => x.id === l?.productId);
      return (
        !!p &&
        p.colors.some((c) => c.id === l.colorId) &&
        typeof l.size === "string" &&
        Number.isInteger(l.qty) &&
        l.qty > 0 &&
        l.key === `${l.productId}:${l.colorId}:${l.size}`
      );
    });
  } catch {
    return [];
  }
}

export default function App() {
  const viewport = useViewport();
  const L = rackLayout(viewport.w, viewport.h);
  const rack = useRef<RackHandle>(null);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [colorIds, setColorIds] = useState<Record<string, string>>(() =>
    Object.fromEntries(PRODUCTS.map((p) => [p.id, p.colors[0].id])),
  );
  const [cart, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const [drawer, setDrawer] = useState<{ open: boolean; pane: Pane; index: number }>({
    open: false,
    pane: "product",
    index: 0,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      /* private mode or full storage: the bag still works for this visit */
    }
  }, [cart]);

  // One colour choice per product, shared by the rack, the detail view and the drawer.
  const colorOf = useCallback(
    (p: Product) => p.colors.find((c) => c.id === colorIds[p.id]) ?? p.colors[0],
    [colorIds],
  );
  const setColor = (productId: string, colorId: string) => setColorIds((m) => ({ ...m, [productId]: colorId }));
  const cartCount = cart.reduce((n, l) => n + l.qty, 0);

  const closeDetail = useCallback(() => setOpenIndex(null), []);
  const closeDrawer = useCallback(() => setDrawer((d) => ({ ...d, open: false })), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openDrawer = (pane: Pane, index?: number) => {
    setNotice(null);
    setDrawer((d) => ({ open: true, pane, index: index ?? d.index }));
  };
  const fromMenu = (pane: Pane) => {
    setMenuOpen(false);
    openDrawer(pane);
  };

  const jump = (i: number) => {
    setMenuOpen(false);
    if (openIndex !== null) setOpenIndex(i); // stay in inspection and swap the garment
    else rack.current?.go(i);
  };
  const onLogo = () => (openIndex !== null ? closeDetail() : rack.current?.go(0));

  // Placeholder auth: swap for your provider (magic link, OAuth…).
  const signIn = (email: string) => setUser(email);
  // Placeholder checkout: hand `cart` to Shopify, Stripe Checkout or your own API here.
  const checkout = () => setNotice("Checkout isn't connected in this demo.");

  const drawerProduct = PRODUCTS[drawer.index];

  return (
    <>
      <SvgDefs />
      <StudioBackdrop floorY={L.floorY} />

      <main>
        <h1 className="sr-only">{`${BRAND.name} — ${BRAND.studio} rack`}</h1>
        <Rack
          ref={rack}
          products={PRODUCTS}
          colorOf={colorOf}
          openIndex={openIndex}
          viewport={viewport}
          onOpen={setOpenIndex}
          onAvailability={(i) => openDrawer("product", i)}
        />
        <AnimatePresence>
          {openIndex !== null && (
            <DetailView
              key="detail"
              products={PRODUCTS}
              index={openIndex}
              color={colorOf(PRODUCTS[openIndex])}
              viewport={viewport}
              covered={drawer.open || menuOpen}
              onSelectColor={(id) => setColor(PRODUCTS[openIndex].id, id)}
              onNavigate={setOpenIndex}
              onClose={closeDetail}
              onAvailability={() => openDrawer("product", openIndex)}
            />
          )}
        </AnimatePresence>
      </main>

      <TopBar
        cartCount={cartCount}
        user={user}
        menuOpen={menuOpen}
        inDetail={openIndex !== null}
        onMenu={() => setMenuOpen(true)}
        onLogo={onLogo}
        onAccount={() => openDrawer("account")}
        onCart={() => openDrawer("bag")}
      />
      <Marquee items={BRAND.ticker} />

      <MenuDrawer
        open={menuOpen}
        products={PRODUCTS}
        activeIndex={openIndex}
        cartCount={cartCount}
        user={user}
        onJump={jump}
        onBag={() => fromMenu("bag")}
        onAccount={() => fromMenu("account")}
        onClose={closeMenu}
      />
      <AvailabilityDrawer
        open={drawer.open}
        pane={drawer.pane}
        product={drawerProduct}
        colorId={colorOf(drawerProduct).id}
        products={PRODUCTS}
        cart={cart}
        user={user}
        notice={notice}
        dispatch={dispatch}
        onPane={(pane) => {
          setNotice(null);
          setDrawer((d) => ({ ...d, pane }));
        }}
        onSelectColor={(id) => setColor(drawerProduct.id, id)}
        onSignIn={signIn}
        onSignOut={() => setUser(null)}
        onCheckout={checkout}
        onClose={closeDrawer}
      />
    </>
  );
}
