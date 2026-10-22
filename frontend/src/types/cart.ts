import type { Id, IsoDateTime, PaymentMethod } from './common';


/** One line inside the single global cart. */
export interface CartLine {
  productId: Id;
  quantity: number;
  /** Snapshot captured when the line was created (keeps rendering cheap). */
  unitPrice: number;
  addedAt: IsoDateTime;
}

export interface CartTotals {
  subtotal: number;
  delivery: number;
  tax: number;
  discount: number;
  grandTotal: number;
  itemCount: number;
  /** Threshold used by the free delivery rule (₹). */
  freeDeliveryThreshold: number;
  freeDeliveryRemaining: number;
  /** Percentage applied (0 when no discount rules are met). */
  discountPercent: number;
}

export interface CartLineView {
  productId: Id;
  name: string;
  code: string;
  image: string;
  unit: string;
  category: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availability: string;
  stockCount: number;
}

/** A saved wishlist entry — persisted per account. */
export interface WishlistItem {
  productId: Id;
  addedAt: IsoDateTime;
}

/** Order snapshot that is sent to the backend to place a real order. */
export interface CheckoutPayload {
  personProfileId: Id;
  addressId: Id;
  paymentMethod: PaymentMethod;
  /** Last four digits only for card/UPI references — never full card data. */
  paymentReference?: string;
}
