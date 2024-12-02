/**
 * Common validation utilities for the restaurant management system
 */

// Email validation using RFC 5322 compliant regex
export const isValidEmail = (email: string): boolean => {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Phone number validation (supports international format)
export const isValidPhoneNumber = (phone: string): boolean => {
  // Supports formats: +1234567890, 1234567890, +1 234-567-890, etc.
  const phoneRegex = /^(\+?\d{1,4})?[-. ]?(\(?\d{1,}\)?[-. ]?){6,}$/;
  return phoneRegex.test(phone) && phone.length >= 10 && phone.length <= 15;
};

// Validate positive numbers (including zero if allowed)
export const isPositiveNumber = (num: number, allowZero = false): boolean => {
  if (typeof num !== 'number' || isNaN(num)) return false;
  return allowZero ? num >= 0 : num > 0;
};

// Validate decimal places
export const hasValidDecimalPlaces = (num: number, maxDecimalPlaces: number): boolean => {
  if (typeof num !== 'number' || isNaN(num)) return false;
  const decimalStr = num.toString().split('.')[1] || '';
  return decimalStr.length <= maxDecimalPlaces;
};

// Date comparison validations
export const isDateRangeValid = (startDate: Date, endDate: Date, allowEqual = true): boolean => {
  if (!(startDate instanceof Date) || !(endDate instanceof Date)) return false;
  return allowEqual ? startDate <= endDate : startDate < endDate;
};

// Check if date is in the future
export const isFutureDate = (date: Date, allowToday = true): boolean => {
  if (!(date instanceof Date)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return allowToday ? date >= today : date > today;
};

// Time format validation (HH:mm)
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Postal/Zip code validation (configurable by country)
export const isValidPostalCode = (code: string, country = 'US'): boolean => {
  const postalRegexByCountry: { [key: string]: RegExp } = {
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i,
    CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ ]?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
    // Add more countries as needed
  };
  return postalRegexByCountry[country]?.test(code) ?? false;
};

// UUID validation
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Password strength validation
export const isStrongPassword = (password: string): boolean => {
  // Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

// Value in range validation
export const isInRange = (value: number, min: number, max: number, inclusive = true): boolean => {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return inclusive ? value >= min && value <= max : value > min && value < max;
};

// Array length validation
export const hasValidArrayLength = (arr: any[], min: number, max: number): boolean => {
  return Array.isArray(arr) && arr.length >= min && arr.length <= max;
};

// String length validation
export const hasValidLength = (str: string, min: number, max: number): boolean => {
  return typeof str === 'string' && str.length >= min && str.length <= max;
};

// Credit card validation (Luhn algorithm)
export const isValidCreditCard = (cardNumber: string): boolean => {
  const sanitized = cardNumber.replace(/[^0-9]/g, '');
  if (!/^\d+$/.test(sanitized)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i));

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Validate business hours format
export const isValidBusinessHours = (hours: unknown): boolean => {
  if (!hours || typeof hours !== 'object') return false;

  const requiredDays = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];
  const hoursObj = hours as Record<string, { open: string; close: string }>;

  return requiredDays.every((day) => {
    const dayHours = hoursObj[day];
    return (
      dayHours &&
      isValidTimeFormat(dayHours.open) &&
      isValidTimeFormat(dayHours.close) &&
      dayHours.open <= dayHours.close
    );
  });
};

// Currency amount validation
export const isValidCurrencyAmount = (amount: number): boolean => {
  return isPositiveNumber(amount, true) && hasValidDecimalPlaces(amount, 2);
};
