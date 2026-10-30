export interface CartLine { key: string; productId: string; colorId: string; size: string; qty: number }

export type CartAction =
  | { type: "add"; productId: string; colorId: string; size: string }
  | { type: "inc" | "dec" | "remove"; key: string };

export function cartReducer(state: CartLine[], a: CartAction): CartLine[] {
  switch (a.type) {
    case "add": {
      const key = `${a.productId}:${a.colorId}:${a.size}`;
      return state.some((l) => l.key === key)
        ? state.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + 1, 9) } : l))
        : [...state, { key, productId: a.productId, colorId: a.colorId, size: a.size, qty: 1 }];
    }
    case "inc":
      return state.map((l) => (l.key === a.key ? { ...l, qty: Math.min(l.qty + 1, 9) } : l));
    case "dec":
      return state.flatMap((l) => (l.key !== a.key ? [l] : l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []));
    case "remove":
      return state.filter((l) => l.key !== a.key);
  }
}
