/* ==========================================================================
   FLOCARDS PAYMENT & BANK DETAILS VALIDATION ENGINE
   Features:
   - Strict UPI ID validation (e.g. username@bank, 9876543210@paytm)
   - Dynamic UPI payment link generation (UPI deep-links for GPay, PhonePe, Paytm)
   - IFSC format validation (e.g. HDFC0000123)
   - Sanitization of private account numbers
   - Secure defaults: bank details private by default, requires explicit publication consent
   ========================================================================== */

/**
 * Standard NPCI UPI ID regex:
 * Starts with alphanumeric, dots, hyphens, underscores (min 2 chars)
 * Followed by '@'
 * Ends with bank handle (min 2 alphabetic/alphanumeric chars)
 */
export const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z0-9.\-_]{2,64}$/;

/**
 * RBI IFSC format:
 * 4 letters (Bank code)
 * 5th character is '0'
 * 6 alphanumeric characters (Branch code)
 */
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/**
 * Validate a UPI ID string
 */
export function validateUpiId(upiId) {
  if (!upiId || typeof upiId !== 'string') {
    return { valid: false, error: 'UPI ID is required.' };
  }
  const clean = upiId.trim();
  if (!UPI_ID_REGEX.test(clean)) {
    return {
      valid: false,
      error: 'Invalid UPI ID format. Format should be like name@upi, 9876543210@paytm, or username@okhdfcbank.'
    };
  }
  return { valid: true, cleanUpiId: clean };
}

/**
 * Generate a standard UPI deep-link URL (RFC-compliant upi://pay URI)
 * Compatible with all Indian UPI apps (BHIM, Google Pay, PhonePe, Paytm, CRED)
 */
export function generateUpiPayUrl({
  upiId,
  recipientName = 'FLOCARDS Merchant',
  amount = null,
  note = 'Payment via FLOCARD profile'
}) {
  const validation = validateUpiId(upiId);
  if (!validation.valid) return '';

  const params = new URLSearchParams();
  params.set('pa', validation.cleanUpiId); // Payee Address
  params.set('pn', recipientName || 'Merchant'); // Payee Name
  params.set('cu', 'INR'); // Currency

  if (amount && Number(amount) > 0) {
    params.set('am', Number(amount).toFixed(2));
  }
  if (note) {
    params.set('tn', note); // Transaction Note
  }

  return `upi://pay?${params.toString()}`;
}

/**
 * Validate an Indian Financial System Code (IFSC)
 */
export function validateIfsc(ifsc) {
  if (!ifsc || typeof ifsc !== 'string') {
    return { valid: false, error: 'IFSC code is required.' };
  }
  const clean = ifsc.trim().toUpperCase();
  if (!IFSC_REGEX.test(clean)) {
    return {
      valid: false,
      error: 'Invalid IFSC code. Format must be 4 letters, 0, and 6 letters/digits (e.g. HDFC0001234 or SBIN0000456).'
    };
  }
  return { valid: true, cleanIfsc: clean };
}

/**
 * Validate bank account details
 */
export function validateBankDetails(bankDetails = {}) {
  const errors = {};

  if (!bankDetails.accountHolder || !bankDetails.accountHolder.trim()) {
    errors.accountHolder = 'Account holder name is required.';
  }

  if (!bankDetails.accountNumber || !bankDetails.accountNumber.trim()) {
    errors.accountNumber = 'Account number is required.';
  } else if (!/^\d{9,18}$/.test(bankDetails.accountNumber.trim().replace(/\s/g, ''))) {
    errors.accountNumber = 'Account number must be 9 to 18 digits.';
  }

  if (bankDetails.ifsc) {
    const ifscCheck = validateIfsc(bankDetails.ifsc);
    if (!ifscCheck.valid) {
      errors.ifsc = ifscCheck.error;
    }
  } else {
    errors.ifsc = 'IFSC code is required.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Format account number with optional partial masking for preview
 */
export function maskAccountNumber(accNum) {
  if (!accNum) return '';
  const clean = String(accNum).replace(/\s/g, '');
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4}`;
}

export const isValidUpiId = (id) => validateUpiId(id).valid;
export const generateUpiPaymentLink = generateUpiPayUrl;
export const isValidIfscCode = (code) => validateIfsc(code).valid;
export const isBankDetailsPublished = (details) => {
  if (!details) return false;
  return Boolean(details.isPubliclyVisible && details.explicitConsentGiven);
};
