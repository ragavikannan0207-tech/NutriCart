import type { Order, User } from '@/types';
import { effectiveStatus } from '@/domain/orders';
import { PRICING } from '@/domain/pricing';
import { formatCurrency, formatDate, formatDateTime, formatTime } from '@/utils/format';

function buildInvoiceNumber(order: Order): string {
  return `INV-${order.orderNumber.replace('NC-', '')}`;
}

/**
 * Printable / downloadable invoice. Every value comes from the stored order
 * snapshot, so the invoice always matches what the customer actually bought.
 */
export function InvoiceDocument({ order, user }: { order: Order; user: User | null }) {
  const status = effectiveStatus(order);
  const nutrition = order.nutrition;

  return (
    <article className="mx-auto max-w-3xl bg-white p-6 text-ink-800 sm:p-8" id="invoice">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-cream-300 pb-5">
        <div>
          <p className="text-xl font-semibold tracking-tight text-forest-800">NutriCart</p>
          <p className="text-xs font-medium text-sage-600">Shop Smart. Eat Healthy.</p>
          <p className="mt-2 text-2xs leading-relaxed text-ink-500">
            NutriCart online grocery service
            <br />
            support: ragavikannan0207@gmail.com
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Tax invoice</p>
          <p className="text-sm font-semibold text-ink-900">{buildInvoiceNumber(order)}</p>
          <p className="text-2xs text-ink-500">Issued {formatDate(order.createdAt)}</p>
          <p className="text-2xs text-ink-500">Order {order.orderNumber}</p>
        </div>
      </header>

      <section className="grid gap-4 border-b border-cream-300 py-5 sm:grid-cols-3">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Customer</p>
          <p className="mt-1 text-sm font-medium text-ink-800">{order.customerName}</p>
          <p className="text-2xs text-ink-500">{user?.email}</p>
        </div>
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Shopping for</p>
          <p className="mt-1 text-sm font-medium text-ink-800">{order.personName}</p>
          <p className="text-2xs text-ink-500">Person profile on this account</p>
        </div>
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Delivery address</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-700">
            {order.address.recipientName}
            <br />
            {order.address.line1}
            {order.address.line2 ? <>, {order.address.line2}</> : null}
            <br />
            {order.address.city}, {order.address.state} — {order.address.pincode}
            <br />
            Phone {order.address.phone}
          </p>
        </div>
      </section>

      <section className="py-5">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-cream-300 text-2xs uppercase tracking-wide text-ink-500">
              <th className="py-2">Product</th>
              <th className="py-2">Unit</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.productId} className="border-b border-cream-200">
                <td className="py-2 pr-2">
                  <span className="font-medium text-ink-800">{item.name}</span>
                  <span className="block text-2xs text-ink-500">{item.category}</span>
                </td>
                <td className="py-2 pr-2 text-ink-600">{item.unit}</td>
                <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                <td className="py-2 text-right tabular-nums">{formatCurrency(item.unitPrice, true)}</td>
                <td className="py-2 text-right font-medium tabular-nums">{formatCurrency(item.lineTotal, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-6 border-t border-cream-300 py-5 sm:grid-cols-2">
        <div className="space-y-1.5 text-xs">
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Purchased nutrition</p>
          <div className="flex justify-between"><span className="text-ink-500">Calories</span><span className="font-medium">{nutrition.calories} kcal</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Protein</span><span className="font-medium">{nutrition.protein} g</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Carbohydrates</span><span className="font-medium">{nutrition.carbs} g</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Fat</span><span className="font-medium">{nutrition.fat} g</span></div>
          <div className="flex justify-between"><span className="text-ink-500">Fibre</span><span className="font-medium">{nutrition.fiber} g</span></div>
          <p className="pt-1 text-2xs leading-relaxed text-ink-500">{PRICING.nutritionDisclaimer}</p>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{formatCurrency(order.subtotal, true)}</span></div>
          {order.discount > 0 ? <div className="flex justify-between"><span className="text-ink-500">Discount</span><span>-{formatCurrency(order.discount, true)}</span></div> : null}
          <div className="flex justify-between"><span className="text-ink-500">Delivery</span><span>{order.delivery === 0 ? 'Free' : formatCurrency(order.delivery, true)}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">GST ({Math.round(PRICING.taxRate * 100)}%)</span><span>{formatCurrency(order.tax, true)}</span></div>
          <div className="mt-1 flex justify-between border-t border-cream-300 pt-2 text-sm font-semibold"><span>Grand total</span><span className="text-forest-800">{formatCurrency(order.grandTotal, true)}</span></div>
        </div>
      </section>

      <section className="grid gap-4 border-t border-cream-300 pt-4 text-xs sm:grid-cols-3">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Payment</p>
          <p className="mt-1 text-ink-700">{order.paymentMethod}</p>
          <p className="text-2xs text-ink-500">{order.paymentReference}</p>
        </div>
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Status</p>
          <p className="mt-1 text-ink-700">{status}</p>
          <p className="text-2xs text-ink-500">Cancelled orders are credited in full.</p>
        </div>
        <div>
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Delivery window</p>
          <p className="mt-1 text-ink-700">{formatDateTime(order.createdAt)} → {formatTime(order.estimatedDeliveryAt)}</p>
          <p className="text-2xs text-ink-500">Promised within 10–20 minutes</p>
        </div>
      </section>

      <footer className="mt-6 border-t border-cream-300 pt-4 text-2xs leading-relaxed text-ink-500">
        This is a computer generated invoice from NutriCart. NutriCart is a grocery e-commerce platform; the nutrition
        figures describe the groceries purchased and are not a medical record. For support, write to
        ragavikannan0207@gmail.com.
      </footer>
    </article>
  );
}
