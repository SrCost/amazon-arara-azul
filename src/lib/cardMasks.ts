/**
 * Masks credit card number as user types
 * @param value - Current input value
 * @returns masked card number (XXXX XXXX XXXX XXXX)
 */
export const maskCardNumber = (value: string): string => {
  let cleanValue = value.replace(/\D/g, '');
  
  // Limit to 16 digits
  if (cleanValue.length > 16) {
    cleanValue = cleanValue.slice(0, 16);
  }

  // Apply mask with spaces every 4 digits
  return cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

/**
 * Masks card expiry date as MM/YY
 * @param value - Current input value
 * @returns masked expiry date
 */
export const maskExpiryDate = (value: string): string => {
  let cleanValue = value.replace(/\D/g, '');
  
  // Limit to 4 digits
  if (cleanValue.length > 4) {
    cleanValue = cleanValue.slice(0, 4);
  }

  // Apply MM/YY format
  if (cleanValue.length >= 3) {
    return cleanValue.replace(/(\d{2})(\d{0,2})/, '$1/$2');
  }
  
  return cleanValue;
};

/**
 * Masks CVV (3 or 4 digits)
 * @param value - Current input value
 * @returns masked CVV
 */
export const maskCVV = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue.slice(0, 4);
};

/**
 * Detects card brand from card number
 * @param cardNumber - Card number string
 * @returns card brand identifier
 */
export const detectCardBrand = (cardNumber: string): string => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  // Visa
  if (/^4/.test(cleanNumber)) {
    return 'visa';
  }
  
  // Mastercard
  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) {
    return 'master';
  }
  
  // Amex
  if (/^3[47]/.test(cleanNumber)) {
    return 'amex';
  }
  
  // Elo
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|6277|6362|6363|6504|6505|6516)/.test(cleanNumber)) {
    return 'elo';
  }
  
  // Hipercard
  if (/^(606282|384100|384140|384160)/.test(cleanNumber)) {
    return 'hipercard';
  }
  
  return 'unknown';
};

/**
 * Validates credit card number using Luhn algorithm
 * @param cardNumber - Card number string
 * @returns boolean - true if valid
 */
export const validateCardNumber = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validates expiry date
 * @param expiryDate - Expiry date in MM/YY format
 * @returns boolean - true if valid and not expired
 */
export const validateExpiryDate = (expiryDate: string): boolean => {
  const cleanValue = expiryDate.replace(/\D/g, '');
  
  if (cleanValue.length !== 4) {
    return false;
  }

  const month = parseInt(cleanValue.substring(0, 2));
  const year = parseInt('20' + cleanValue.substring(2, 4));

  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) {
    return false;
  }

  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
};