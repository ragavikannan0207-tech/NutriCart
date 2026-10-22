import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, CheckCircle2, CreditCard, MapPin, Plus, Smartphone, UserRound } from 'lucide-react';
import { clsx } from 'clsx';
import type { AddressInput, PaymentMethod } from '@/types';
import { PRICING } from '@/domain/pricing';
import { useAppData } from '@/state/hooks';
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui/Primitives';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Checkbox, TextInput } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ProfileList } from '@/components/profile/ProfileList';
import { formatCurrency } from '@/utils/format';
import {
  validateCardHolder,
  validateCardNumber,
  validateCvv,
  validateExpiry,
  validatePhone,
  validatePincode,
  validateUpiId,
  required,
} from '@/utils/validation';
import { friendlyMessage } from '@/utils/errors';
import { useToast } from '@/state/ToastContext';
import { useAuth } from '@/state/AuthContext';

const PAYMENT_OPTIONS: Array<{ value: PaymentMethod; label: string; description: string; icon: typeof Banknote }> = [
  { value: 'COD', label: 'Cash on Delivery', description: 'Pay the delivery partner in cash', icon: Banknote },
  { value: 'UPI', label: 'UPI', description: 'Pay with any UPI app', icon: Smartphone },
  { value: 'Card', label: 'Card', description: 'Credit or debit card', icon: CreditCard },
];

/**
 * Checkout — a focused flow in six steps: address, person, items, payment,
 * review and place order. Payment details are validated and only a masked
 * reference is ever kept. No full card number is stored anywhere.
 */
export function CheckoutPage() {
  const { cart, pricedCart, addresses, defaultAddress, createAddress, profiles, activeProfile, setActiveProfile, placeOrder } = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [addressId, setAddressId] = useState<number | null>(defaultAddress?.id ?? null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>('COD');
  const [placing, setPlacing] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string | undefined>>({});
  const [addressErrors, setAddressErrors] = useState<Record<string, string | undefined>>({});
  const [addressDraft, setAddressDraft] = useState<AddressInput>({
    label: 'Home',
    recipientName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true,
  });
  const [paymentFields, setPaymentFields] = useState({ upi: '', holder: '', number: '', expiry: '', cvv: '', saveReference: true });

  const selectedAddress = addresses.find((address) => address.id === addressId) ?? defaultAddress;

  if (cart.length === 0) {
    return (
      <EmptyState
        title="Nothing to check out yet"
        description="Your cart is empty. Add a few groceries, then come back to complete the order."
        action={<ButtonLink to="/shop">Shop groceries</ButtonLink>}
      />
    );
  }

  const validatePayment = (): boolean => {
    const errors: Record<string, string | undefined> = {};
    if (payment === 'UPI') errors.upi = validateUpiId(paymentFields.upi);
    if (payment === 'Card') {
      errors.holder = validateCardHolder(paymentFields.holder);
      errors.number = validateCardNumber(paymentFields.number);
      errors.expiry = validateExpiry(paymentFields.expiry);
      errors.cvv = validateCvv(paymentFields.cvv);
    }
    setPaymentErrors(errors);
    return Object.values(errors).every((value) => !value);
  };

  const paymentReference = (): string => {
    if (payment === 'COD') return 'Cash on delivery';
    if (payment === 'UPI') return `UPI ${paymentFields.upi}`;
    const digits = paymentFields.number.replace(/\D/g, '');
    return `Card ending ${digits.slice(-4)}`;
  };

  const submitAddress = async (event: FormEvent) => {
    event.preventDefault();
    const errors = {
      recipientName: required(addressDraft.recipientName, 'Recipient name'),
      phone: validatePhone(addressDraft.phone),
      line1: required(addressDraft.line1, 'Address line 1'),
      city: required(addressDraft.city, 'City'),
      state: required(addressDraft.state, 'State'),
      pincode: validatePincode(addressDraft.pincode),
    };
    setAddressErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    const created = await createAddress(addressDraft);
    setAddressId(created.id);
    setAddressModalOpen(false);
    toast.success('Delivery address saved');
  };

  const submit = async () => {
    if (!selectedAddress) {
      toast.error('Add a delivery address', 'NutriCart needs an address before it can deliver.');
      return;
    }
    if (!activeProfile) {
      toast.error('Select who you are shopping for');
      return;
    }
    if (!validatePayment()) {
      toast.error('Check the payment details', 'Some payment fields still need attention.');
      return;
    }
    setPlacing(true);
    try {
      const order = await placeOrder({
        addressId: selectedAddress.id,
        paymentMethod: payment,
        paymentReference: paymentReference(),
      });
      navigate(`/order-confirmation/${order.id}`, { replace: true });
    } catch (error) {
      toast.error('Could not place the order', friendlyMessage(error));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Checkout</h1>
        <p className="mt-1 text-sm text-ink-500">Confirm who you are shopping for, where it goes and how you pay.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title={<span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-sage-600" /> 1 · Delivery address</span>}
              action={
                <Button variant="outline" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAddressModalOpen(true)}>
                  Add address
                </Button>
              }
            />
            <div className="space-y-2 px-5 py-4">
              {addresses.length === 0 ? (
                <EmptyState
                  compact
                  title="No saved addresses yet"
                  description="Add the address where the groceries should be delivered."
                  action={<Button size="sm" onClick={() => setAddressModalOpen(true)}>Add delivery address</Button>}
                />
              ) : (
                addresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => setAddressId(address.id)}
                    className={clsx(
                      'flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition',
                      address.id === selectedAddress?.id ? 'border-forest-300 bg-forest-50/60' : 'border-cream-300 hover:border-forest-200',
                    )}
                  >
                    <span className="mt-0.5">
                      {address.id === selectedAddress?.id ? (
                        <CheckCircle2 className="h-4 w-4 text-forest-700" />
                      ) : (
                        <span className="block h-4 w-4 rounded-full border border-cream-400" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink-900">{address.recipientName}</span>
                        <Badge tone="neutral">{address.label}</Badge>
                        {address.isDefault ? <Badge tone="success">Default</Badge> : null}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-ink-500">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} — {address.pincode}
                      </span>
                      <span className="mt-0.5 block text-2xs text-ink-500">Phone {address.phone}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title={<span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-sage-600" /> 2 · Shopping for</span>} subtitle="Recommendations, pantry and nutrition follow this person." />
            <div className="px-5 py-4">
              <ProfileList profiles={profiles} onSelect={(id) => void setActiveProfile(id)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="3 · Order items" subtitle={`${pricedCart.totals.itemCount} items in your cart`} />
            <ul className="divide-y divide-cream-200">
              {pricedCart.lines.map((line) => (
                <li key={line.productId} className="flex items-center gap-3 px-5 py-3">
                  <img src={line.image} alt={line.name} className="h-11 w-11 rounded-xl border border-cream-300 object-cover" loading="lazy" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink-800">{line.name}</span>
                    <span className="block text-xs text-ink-500">
                      {line.unit} · {formatCurrency(line.unitPrice)} × {line.quantity}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-ink-900">{formatCurrency(line.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end px-5 py-3">
              <ButtonLink to="/cart" variant="ghost" size="sm">
                Edit cart
              </ButtonLink>
            </div>
          </Card>

          <Card>
            <CardHeader title="4 · Payment method" subtitle="Only a masked reference is stored — never your full card details." />
            <div className="space-y-3 px-5 py-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {PAYMENT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPayment(option.value)}
                    className={clsx(
                      'flex flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition',
                      payment === option.value ? 'border-forest-300 bg-forest-50/60' : 'border-cream-300 hover:border-forest-200',
                    )}
                  >
                    <option.icon className="h-4 w-4 text-sage-600" />
                    <span className="text-sm font-semibold text-ink-900">{option.label}</span>
                    <span className="text-2xs text-ink-500">{option.description}</span>
                  </button>
                ))}
              </div>

              {payment === 'UPI' ? (
                <TextInput
                  label="UPI ID"
                  placeholder="ragavi@okhdfcbank"
                  value={paymentFields.upi}
                  error={paymentErrors.upi}
                  onChange={(event) => setPaymentFields((current) => ({ ...current, upi: event.target.value }))}
                />
              ) : null}

              {payment === 'Card' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    label="Card holder"
                    placeholder="RAGAVI KANNAN"
                    value={paymentFields.holder}
                    error={paymentErrors.holder}
                    wrapperClassName="sm:col-span-2"
                    onChange={(event) => setPaymentFields((current) => ({ ...current, holder: event.target.value }))}
                  />
                  <TextInput
                    label="Card number"
                    placeholder="4111 1111 1111 1111"
                    inputMode="numeric"
                    value={paymentFields.number}
                    error={paymentErrors.number}
                    wrapperClassName="sm:col-span-2"
                    onChange={(event) =>
                      setPaymentFields((current) => ({
                        ...current,
                        number: event.target.value.replace(/[^0-9 ]/g, '').slice(0, 19),
                      }))
                    }
                  />
                  <TextInput
                    label="Expiry"
                    placeholder="MM/YY"
                    value={paymentFields.expiry}
                    error={paymentErrors.expiry}
                    onChange={(event) => setPaymentFields((current) => ({ ...current, expiry: event.target.value.replace(/[^0-9/]/g, '').slice(0, 5) }))}
                  />
                  <TextInput
                    label="CVV"
                    placeholder="123"
                    type="password"
                    value={paymentFields.cvv}
                    error={paymentErrors.cvv}
                    onChange={(event) => setPaymentFields((current) => ({ ...current, cvv: event.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  />
                  <div className="sm:col-span-2">
                    <Checkbox
                      label="Remember the card reference for this session only"
                      checked={paymentFields.saveReference}
                      onChange={(event) => setPaymentFields((current) => ({ ...current, saveReference: event.target.checked }))}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader title="5 · Order review" subtitle="Everything that will be created when you place the order" />
            <div className="space-y-3 px-5 py-4">
              <ReviewRow label="Customer" value={user?.fullName ?? '—'} />
              <ReviewRow label="Shopping for" value={activeProfile?.name ?? 'Not selected'} />
              <ReviewRow
                label="Deliver to"
                value={selectedAddress ? `${selectedAddress.line1}, ${selectedAddress.city} — ${selectedAddress.pincode}` : 'No address selected'}
              />
              <ReviewRow label="Payment" value={paymentReference()} />

              <div className="h-px w-full bg-cream-200" />
              <ReviewRow label="Subtotal" value={formatCurrency(pricedCart.totals.subtotal)} />
              {pricedCart.totals.discount > 0 ? (
                <ReviewRow label={`Discount (${pricedCart.totals.discountPercent}%)`} value={`-${formatCurrency(pricedCart.totals.discount)}`} />
              ) : null}
              <ReviewRow label="Delivery" value={pricedCart.totals.delivery === 0 ? 'Free' : formatCurrency(pricedCart.totals.delivery)} />
              <ReviewRow label={`GST (${Math.round(PRICING.taxRate * 100)}%)`} value={formatCurrency(pricedCart.totals.tax)} />
              <div className="h-px w-full bg-cream-200" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-ink-900">Grand total</span>
                <span className="text-xl font-semibold tracking-tight text-forest-800">{formatCurrency(pricedCart.totals.grandTotal)}</span>
              </div>

              <Button fullWidth size="lg" loading={placing} onClick={() => void submit()} disabled={!selectedAddress || !activeProfile}>
                Place order
              </Button>
              <p className="text-center text-2xs leading-relaxed text-ink-500">
                Estimated delivery in 10–20 minutes. You can cancel free within 60 seconds of placing the order.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="What happens next" />
            <div className="px-5 py-4">
              <p className="text-2xs leading-relaxed text-ink-500">
                Placing the order empties the cart and instantly updates Orders, tracking, Budget, Purchased Nutrition,
                Overview and For You. Delivery is promised inside a 10–20 minute window and the order can be cancelled free
                within 60 seconds.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
        title="Add a delivery address"
        description="Used on the order and printed on the invoice."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddressModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="address-form">
              Save address
            </Button>
          </div>
        }
      >
        <form id="address-form" onSubmit={submitAddress} className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Label"
            placeholder="Home"
            value={addressDraft.label}
            onChange={(event) => setAddressDraft((current) => ({ ...current, label: event.target.value }))}
          />
          <TextInput
            label="Recipient name"
            required
            value={addressDraft.recipientName}
            error={addressErrors.recipientName}
            onChange={(event) => setAddressDraft((current) => ({ ...current, recipientName: event.target.value }))}
          />
          <TextInput
            label="Phone"
            required
            inputMode="numeric"
            placeholder="9876543210"
            value={addressDraft.phone}
            error={addressErrors.phone}
            onChange={(event) => setAddressDraft((current) => ({ ...current, phone: event.target.value.replace(/\D/g, '').slice(0, 10) }))}
          />
          <TextInput
            label="Pincode"
            required
            inputMode="numeric"
            placeholder="600001"
            value={addressDraft.pincode}
            error={addressErrors.pincode}
            onChange={(event) => setAddressDraft((current) => ({ ...current, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
          />
          <TextInput
            label="Address line 1"
            required
            wrapperClassName="sm:col-span-2"
            placeholder="12, Green Park Street"
            value={addressDraft.line1}
            error={addressErrors.line1}
            onChange={(event) => setAddressDraft((current) => ({ ...current, line1: event.target.value }))}
          />
          <TextInput
            label="Address line 2"
            wrapperClassName="sm:col-span-2"
            placeholder="Apartment, landmark (optional)"
            value={addressDraft.line2}
            onChange={(event) => setAddressDraft((current) => ({ ...current, line2: event.target.value }))}
          />
          <TextInput
            label="City"
            required
            value={addressDraft.city}
            error={addressErrors.city}
            onChange={(event) => setAddressDraft((current) => ({ ...current, city: event.target.value }))}
          />
          <TextInput
            label="State"
            required
            value={addressDraft.state}
            error={addressErrors.state}
            onChange={(event) => setAddressDraft((current) => ({ ...current, state: event.target.value }))}
          />
          <div className="sm:col-span-2">
            <Checkbox
              label="Make this my default delivery address"
              checked={addressDraft.isDefault}
              onChange={(event) => setAddressDraft((current) => ({ ...current, isDefault: event.target.checked }))}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-ink-800">{value}</span>
    </div>
  );
}
