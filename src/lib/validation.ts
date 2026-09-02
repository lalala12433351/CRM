import { CustomFieldDef } from '../types';

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  cleanedValue?: any;
}

/**
 * Validates phone numbers ensuring standard 10-digit format and limits.
 */
export function validatePhone(rawPhone: string, required: boolean = false): FieldValidationResult {
  const trimmed = (rawPhone || '').trim();
  if (!trimmed) {
    if (required) return { isValid: false, error: 'Phone number is required.' };
    return { isValid: true, cleanedValue: '' };
  }

  // Extract national digits
  const digitsOnly = trimmed.replace(/\D/g, '');
  // If user entered +91 or 91 with 12 digits, extract the 10 national digits
  const nationalDigits = digitsOnly.startsWith('91') && digitsOnly.length === 12 ? digitsOnly.slice(2) : digitsOnly;

  if (nationalDigits.length > 10) {
    return { isValid: false, error: 'Phone number cannot exceed 10 digits.' };
  }
  if (nationalDigits.length < 10) {
    return { isValid: false, error: 'Phone number must contain exactly 10 digits.' };
  }

  return { isValid: true, cleanedValue: nationalDigits };
}

/**
 * Validates standard email address format.
 */
export function validateEmail(rawEmail: string, required: boolean = false): FieldValidationResult {
  const trimmed = (rawEmail || '').trim();
  if (!trimmed) {
    if (required) return { isValid: false, error: 'Email address is required.' };
    return { isValid: true, cleanedValue: '' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@domain.com).' };
  }

  return { isValid: true, cleanedValue: trimmed };
}

/**
 * Validates currency and numeric amounts against min/max limits.
 */
export function validateCurrencyOrNumber(
  rawValue: string | number,
  field?: Partial<CustomFieldDef>,
  required: boolean = false
): FieldValidationResult {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === '') {
    if (required) return { isValid: false, error: `${field?.label || 'This field'} is required.` };
    return { isValid: true, cleanedValue: 0 };
  }

  const cleanedStr = String(rawValue).trim().replace(/,/g, '');
  const num = Number(cleanedStr);

  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid numeric value.' };
  }

  const min = field?.minValue ?? 0;
  if (num < min) {
    return { isValid: false, error: `Value cannot be less than ${min}.` };
  }

  const max = field?.maxValue ?? 1_000_000_000;
  if (num > max) {
    return { isValid: false, error: `Value cannot exceed ₹${max.toLocaleString('en-IN')}.` };
  }

  return { isValid: true, cleanedValue: num };
}

/**
 * Validates text string lengths against minLength and maxLength limits.
 */
export function validateText(
  rawValue: string,
  field?: Partial<CustomFieldDef>,
  required: boolean = false
): FieldValidationResult {
  const trimmed = (rawValue || '').trim();
  if (!trimmed) {
    if (required || field?.required) {
      return { isValid: false, error: `${field?.label || 'This field'} is required.` };
    }
    return { isValid: true, cleanedValue: '' };
  }

  const minLen = field?.minLength;
  if (minLen !== undefined && minLen > 0 && trimmed.length < minLen) {
    return { isValid: false, error: `${field?.label || 'Text'} must be at least ${minLen} characters.` };
  }

  const maxLen = field?.maxLength;
  if (maxLen !== undefined && maxLen > 0 && trimmed.length > maxLen) {
    return { isValid: false, error: `${field?.label || 'Text'} cannot exceed ${maxLen} characters.` };
  }

  return { isValid: true, cleanedValue: trimmed };
}

/**
 * Universal validator that routes any field to its appropriate type checker.
 */
export function validateField(field: Partial<CustomFieldDef>, rawValue: any): FieldValidationResult {
  const key = field.name || field.id || '';
  const labelLower = (field.label || '').toLowerCase();
  const type = field.type;

  if (
    type === 'phone' ||
    key === 'phone' ||
    key === 'alternate_phone' ||
    key === 'alternatePhone' ||
    labelLower.includes('phone') ||
    labelLower.includes('number')
  ) {
    return validatePhone(String(rawValue || ''), field.required);
  }

  if (type === 'email' || key === 'email' || labelLower.includes('email')) {
    return validateEmail(String(rawValue || ''), field.required);
  }

  if (
    type === 'currency' ||
    type === 'number' ||
    key === 'deal_value' ||
    key === 'dealValue' ||
    labelLower.includes('deal value') ||
    labelLower.includes('budget')
  ) {
    return validateCurrencyOrNumber(rawValue, field, field.required);
  }

  return validateText(String(rawValue || ''), field, field.required);
}
