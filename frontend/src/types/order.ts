import type { Id, IsoDate, IsoDateTime, NutritionFacts, OrderStatus, PaymentMethod } from './common';

export interface OrderItem {
  productId: Id;
  code: string;
  name: string;
  image: string;
  unit: string;
  category: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** Nutrition snapshot per unit — powers Purchased Nutrition without re-reading the catalogue. */
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

/** Immutable address snapshot stored with the order. */
export interface OrderAddress {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: Id;
  /** Human readable order reference, e.g. NC-20260920-4821 */
  orderNumber: string;
  userId: Id;
  personProfileId: Id;
  personName: string;
  customerName: string;
  address: OrderAddress;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  status: OrderStatus;
  createdAt: IsoDateTime;
  /** ETA promised at checkout (10–20 minutes delivery window). */
  estimatedDeliveryAt: IsoDateTime;
  updatedAt: IsoDateTime;
  deliveredAt: IsoDateTime | null;
  cancelledAt: IsoDateTime | null;
  /** Totals of the nutrition purchased in this order. */
  nutrition: NutritionFacts;
  notes: string;
}

/** Window (in ms) during which an order can still be cancelled. */
export const ORDER_CANCELLATION_WINDOW_MS = 60_000;

export interface OrderTrackingStep {
  status: OrderStatus;
  label: string;
  description: string;
  reachedAt: IsoDateTime | null;
  isCurrent: boolean;
  isComplete: boolean;
}

export interface DeliveryEstimate {
  minMinutes: number;
  maxMinutes: number;
  windowStart: IsoDateTime;
  windowEnd: IsoDateTime;
}

export interface ReorderLine {
  productId: Id;
  name: string;
  quantity: number;
}

export interface InvoiceLine {
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  invoiceNumber: string;
  issuedOn: IsoDate;
  orderNumber: string;
  orderDate: IsoDateTime;
  customerName: string;
  customerEmail: string;
  personName: string;
  address: OrderAddress;
  lines: InvoiceLine[];
  subtotal: number;
  delivery: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  estimatedDelivery: string;
  nutrition: NutritionFacts;
}
