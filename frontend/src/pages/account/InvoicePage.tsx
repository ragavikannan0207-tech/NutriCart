import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Share2 } from 'lucide-react';
import { useAppData } from '@/state/hooks';
import { useAuth } from '@/state/AuthContext';
import { useToast } from '@/state/ToastContext';
import { InvoiceDocument } from '@/components/orders/InvoiceDocument';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Primitives';

/**
 * Invoice page. "Download" prints the same document to PDF through the browser's
 * print dialog — no fake email or fabricated sending is involved.
 */
export function InvoicePage() {
  const { orderId } = useParams();
  const { orders } = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const order = orders.find((entry) => entry.id === Number(orderId));

  if (!order) {
    return (
      <EmptyState
        title="Invoice not available"
        description="We could not find that order on this account."
        action={<ButtonLink to="/orders" size="sm">Back to orders</ButtonLink>}
      />
    );
  }

  const invoiceNumber = `INV-${order.orderNumber.replace('NC-', '')}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to={`/orders/${order.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-forest-700">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to order
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Share2 className="h-3.5 w-3.5" />}
            onClick={async () => {
              const text = `NutriCart invoice ${invoiceNumber} · ${order.orderNumber} · ₹${order.grandTotal}`;
              try {
                await navigator.clipboard.writeText(text);
                toast.success('Invoice reference copied');
              } catch {
                toast.info('Copy unavailable', 'Your browser blocked clipboard access.');
              }
            }}
          >
            Copy reference
          </Button>
          <Button size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => window.print()}>
            Download invoice
          </Button>
          <Button variant="ghost" size="sm" icon={<Printer className="h-3.5 w-3.5" />} onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-card print:border-0 print:shadow-none">
        <InvoiceDocument order={order} user={user} />
      </div>
    </div>
  );
}
