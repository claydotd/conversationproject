export type ProductKind = "digital" | "physical";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  currency: string;
  kind: ProductKind;
  sumupCheckoutId?: string;
  downloadBlobKey?: string;
  inventory?: number | null;
  published: boolean;
}

export interface CheckoutSession {
  productId: string;
  sumupCheckoutId: string;
  status: "pending" | "paid" | "failed";
}
