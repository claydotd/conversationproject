import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "tcp-trolley";

export interface CartLine {
  productId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartLine[];
  itemCount: number;
  addItem: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const productId = String(
          (item as { productId?: string })?.productId ?? "",
        );
        const quantity = Math.floor(
          Number((item as { quantity?: number })?.quantity),
        );
        if (!productId || !Number.isFinite(quantity) || quantity < 1) {
          return null;
        }
        return { productId, quantity };
      })
      .filter((item): item is CartLine => Boolean(item));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  function addItem(productId: string, quantity = 1) {
    const addBy = Math.max(1, Math.floor(quantity));
    setItems((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (!existing) {
        return [...current, { productId, quantity: addBy }];
      }
      return current.map((line) =>
        line.productId === productId
          ? { ...line, quantity: line.quantity + addBy }
          : line,
      );
    });
  }

  function setQuantity(productId: string, quantity: number) {
    const next = Math.floor(quantity);
    setItems((current) => {
      if (!Number.isFinite(next) || next < 1) {
        return current.filter((line) => line.productId !== productId);
      }
      if (!current.some((line) => line.productId === productId)) {
        return [...current, { productId, quantity: next }];
      }
      return current.map((line) =>
        line.productId === productId ? { ...line, quantity: next } : line,
      );
    });
  }

  function removeItem(productId: string) {
    setItems((current) =>
      current.filter((line) => line.productId !== productId),
    );
  }

  function clear() {
    setItems([]);
  }

  const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, addItem, setQuantity, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return value;
}
