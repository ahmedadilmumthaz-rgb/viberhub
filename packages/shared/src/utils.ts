import { ApiResponse, ApiErrorResponse, ApiMeta } from './types.js';

/**
 * Normalizes phone numbers to standard E.164 format where feasible (+[country_code][digits]).
 * Strips all spaces, parentheses, dashes, and other non-digit characters except leading '+'.
 */
export function normalizePhoneToE164(rawPhone: string, defaultCountryCode = '1'): string {
  if (!rawPhone) return '';
  const trimmed = rawPhone.trim();
  const hasLeadingPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  if (!digitsOnly) return '';

  if (hasLeadingPlus) {
    return `+${digitsOnly}`;
  }

  // If starts with 00 (common international exit code), replace with +
  if (digitsOnly.startsWith('00')) {
    return `+${digitsOnly.slice(2)}`;
  }

  // If standard 10 digit without leading plus and country code provided
  if (digitsOnly.length === 10 && defaultCountryCode) {
    return `+${defaultCountryCode.replace(/\D/g, '')}${digitsOnly}`;
  }

  // If already looks like country code + number (11+ digits)
  if (digitsOnly.length >= 11) {
    return `+${digitsOnly}`;
  }

  return `+${digitsOnly}`;
}

export function isValidE164(phone: string): boolean {
  // E.164: + followed by 7 to 15 digits
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/**
 * Strict template variable allowlist as per specification section 11:
 * {{name}}, {{phone}}, {{company}}, {{date}}
 */
export const ALLOWED_TEMPLATE_VARIABLES = ['name', 'phone', 'company', 'date'] as const;
export type AllowedTemplateVariable = typeof ALLOWED_TEMPLATE_VARIABLES[number];

export interface TemplateInterpolationResult {
  renderedText: string;
  missingVariables: string[];
  usedVariables: string[];
  invalidVariables: string[];
}

export interface TemplateContext {
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  date?: string | null;
  [key: string]: string | null | undefined;
}

/**
 * Extracts and interpolates variables safely. Escapes or strips HTML/executable content.
 */
export function renderTemplate(templateBody: string, context: TemplateContext): TemplateInterpolationResult {
  const missingVariables: string[] = [];
  const usedVariables: string[] = [];
  const invalidVariables: string[] = [];

  // Regex to match {{variable_name}}
  const variableRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

  const renderedText = templateBody.replace(variableRegex, (match, varName) => {
    const normalizedVar = varName.toLowerCase();

    if (!ALLOWED_TEMPLATE_VARIABLES.includes(normalizedVar as AllowedTemplateVariable)) {
      if (!invalidVariables.includes(varName)) {
        invalidVariables.push(varName);
      }
      return match; // Keep unresolved
    }

    if (!usedVariables.includes(normalizedVar)) {
      usedVariables.push(normalizedVar);
    }

    const value = context[normalizedVar];
    if (value === undefined || value === null || value.trim() === '') {
      if (!missingVariables.includes(normalizedVar)) {
        missingVariables.push(normalizedVar);
      }
      return match; // Leave placeholder or empty
    }

    // Sanitize value to prevent code/HTML injection
    return sanitizeText(value);
  });

  return {
    renderedText,
    missingVariables,
    usedVariables,
    invalidVariables
  };
}

export function sanitizeText(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function successEnvelope<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return {
    data,
    ...(meta ? { meta: { ...meta, timestamp: meta.timestamp || new Date().toISOString() } } : {})
  };
}

export function errorEnvelope(code: string, message: string, details?: unknown): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {})
    }
  };
}
