/**
 * Form validation. Every rule mirrors the server-side validation in the Spring
 * Boot DTOs (backend/src/main/java/com/nutricart/dto/**) so the user sees the
 * same message whether it is caught in the browser or by the API.
 */

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;
export const PHONE_PATTERN = /^[6-9][0-9]{9}$/;
export const UPI_PATTERN = /^[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}$/;

export function required(value: string | number | null | undefined, label: string): string | undefined {
  if (value === null || value === undefined) return `${label} is required`;
  if (typeof value === 'string' && value.trim().length === 0) return `${label} is required`;
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  const missing = required(email, 'Email');
  if (missing) return missing;
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address, for example name.123@gmail.com';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  const missing = required(password, 'Password');
  if (missing) return missing;
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(password)) return 'Password must include at least one letter';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number';
  return undefined;
}

export function validateConfirmPassword(password: string, confirm: string): string | undefined {
  const missing = required(confirm, 'Confirm password');
  if (missing) return missing;
  if (password !== confirm) return 'Passwords do not match';
  return undefined;
}

export function validateFullName(name: string): string | undefined {
  const missing = required(name, 'Full name');
  if (missing) return missing;
  if (name.trim().length < 2) return 'Full name must be at least 2 characters';
  return undefined;
}

export function validateAge(age: number): string | undefined {
  if (age === null || age === undefined || Number.isNaN(age)) return 'Age is required';
  if (age < 1) return 'Age must be at least 1';
  if (age > 100) return 'Age cannot be more than 100';
  return undefined;
}

export function validatePincode(pincode: string): string | undefined {
  const missing = required(pincode, 'Pincode');
  if (missing) return missing;
  if (!PINCODE_PATTERN.test(pincode.trim())) return 'Enter a valid 6 digit pincode';
  return undefined;
}

export function validatePhone(phone: string): string | undefined {
  const missing = required(phone, 'Phone number');
  if (missing) return missing;
  if (!PHONE_PATTERN.test(phone.trim())) return 'Enter a valid 10 digit mobile number';
  return undefined;
}

/* ------------------------------------------------------------- PAYMENT ---- */

export function validateCardHolder(name: string): string | undefined {
  return required(name, 'Card holder name');
}

export function validateCardNumber(raw: string): string | undefined {
  const digits = raw.replace(/\s|-/g, '');
  const missing = required(digits, 'Card number');
  if (missing) return missing;
  if (!/^[0-9]{13,19}$/.test(digits)) return 'Card number must be 13 to 19 digits';
  if (!luhnValid(digits)) return 'This card number looks invalid';
  return undefined;
}

export function validateExpiry(expiry: string): string | undefined {
  const missing = required(expiry, 'Expiry date');
  if (missing) return missing;
  const match = expiry.trim().match(/^([0-9]{2})\s*\/\s*([0-9]{2})$/);
  if (!match) return 'Use MM/YY format';
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return 'Month must be between 01 and 12';
  const expiryDate = new Date(year, month, 1);
  const now = new Date();
  if (expiryDate <= new Date(now.getFullYear(), now.getMonth(), 1)) return 'Card has expired';
  return undefined;
}

export function validateCvv(cvv: string): string | undefined {
  const missing = required(cvv, 'CVV');
  if (missing) return missing;
  if (!/^[0-9]{3,4}$/.test(cvv.trim())) return 'CVV must be 3 or 4 digits';
  return undefined;
}

export function validateUpiId(upi: string): string | undefined {
  const missing = required(upi, 'UPI ID');
  if (missing) return missing;
  if (!UPI_PATTERN.test(upi.trim())) return 'Enter a valid UPI ID such as name@bank';
  return undefined;
}

/** Standard Luhn checksum — the same check the backend performs. */
export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i]);
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((value) => Boolean(value));
}
