/**
 * Phone number normalization and E.164 validation utilities.
 * Conforms to ITU-T E.164 standard (+[country code][subscriber number]).
 */

// Standard E.164 numbers are between 7 and 15 digits (+[1-9] followed by 6 to 14 digits).
const E164_REGEX = /^\+[1-9]\d{6,14}$/

/**
 * Normalizes an input phone number into E.164 standard string.
 * Supports:
 * - 10-digit Indian numbers (e.g. "9876543210" -> "+919876543210")
 * - 11-digit leading-zero numbers (e.g. "09876543210" -> "+919876543210")
 * - 12-digit numbers without plus (e.g. "919876543210" -> "+919876543210")
 * - International numbers already prefixed with '+' (e.g. "+919876543210", "+14155552671")
 */
export function formatToE164(phone: string, defaultCountryCode = "+91"): string {
  if (!phone) return ""

  const clean = phone.trim()

  if (clean.startsWith("+")) {
    // Remove any accidental whitespace/dashes from phone formatted with '+'
    return "+" + clean.slice(1).replace(/\D/g, "")
  }

  const digitsOnly = clean.replace(/\D/g, "")

  // 10 digits: Indian domestic number
  if (digitsOnly.length === 10) {
    const cc = defaultCountryCode.startsWith("+") ? defaultCountryCode : `+${defaultCountryCode}`
    return `${cc}${digitsOnly}`
  }

  // 11 digits starting with 0: Indian domestic number with trunk prefix
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    const cc = defaultCountryCode.startsWith("+") ? defaultCountryCode : `+${defaultCountryCode}`
    return `${cc}${digitsOnly.slice(1)}`
  }

  // 12 digits starting with 91: Indian number without '+'
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`
  }

  // If already at least 7 digits, prefix with '+'
  if (digitsOnly.length >= 7) {
    return `+${digitsOnly}`
  }

  return digitsOnly ? `+${digitsOnly}` : ""
}

/**
 * Validates whether a phone number strictly matches E.164 format.
 */
export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone)
}

/**
 * Formats and validates input phone number.
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; e164: string; error?: string } {
  if (!phone || !phone.trim()) {
    return { isValid: false, e164: "", error: "Phone number is required." }
  }

  const formatted = formatToE164(phone)

  if (!formatted || !isValidE164(formatted)) {
    return {
      isValid: false,
      e164: formatted,
      error: "Invalid phone number format. Must be a valid E.164 mobile number (e.g. +919876543210).",
    }
  }

  // If Indian country code (+91), verify it has 10 subscriber digits (total 13 chars including +91)
  if (formatted.startsWith("+91")) {
    const subscriber = formatted.slice(3)
    if (subscriber.length !== 10 || !/^[6-9]\d{9}$/.test(subscriber)) {
      return {
        isValid: false,
        e164: formatted,
        error: "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.",
      }
    }
  }

  return { isValid: true, e164: formatted }
}
