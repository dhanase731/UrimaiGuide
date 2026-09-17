// Module 1 — User Registration domain model.
// Mirrors the backend Pydantic `RegisterRequest` / `RegisterResponse` contract
// so the prototype's JSON preview stays in sync with the FastAPI schema.

export type PreferredLanguage = "ENGLISH" | "TAMIL" | "HINDI"

export interface RegistrationForm {
  full_name: string
  mobile_number: string
  email: string
  state: string
  district: string
  pincode: string
  preferred_language: PreferredLanguage
  is_nri: boolean
  nri_country: string
  password: string
  otp_verified: boolean
  fcm_token: string | null
}

export const EMPTY_REGISTRATION: RegistrationForm = {
  full_name: "",
  mobile_number: "",
  email: "",
  state: "",
  district: "",
  pincode: "",
  preferred_language: "ENGLISH",
  is_nri: false,
  nri_country: "",
  password: "",
  otp_verified: false,
  fcm_token: null,
}

export const LANGUAGES: { value: PreferredLanguage; label: string; native: string }[] = [
  { value: "ENGLISH", label: "English", native: "English" },
  { value: "TAMIL", label: "Tamil", native: "தமிழ்" },
  { value: "HINDI", label: "Hindi", native: "हिन्दी" },
]

// 28 states + 8 union territories.
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
]

export type RegistrationErrors = Partial<Record<keyof RegistrationForm, string>>

// Field-level validation matching the backend RegisterRequest validators.
export function validateRegistration(form: RegistrationForm): RegistrationErrors {
  const errors: RegistrationErrors = {}

  const name = form.full_name.trim()
  if (name.length < 2) errors.full_name = "Enter your full name (at least 2 characters)."
  else if (name.length > 100) errors.full_name = "Name must be 100 characters or fewer."

  if (!/^\d{10}$/.test(form.mobile_number))
    errors.mobile_number = "Enter a 10-digit mobile number, no country code."

  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = "Enter a valid email address."

  if (!form.state) errors.state = "Select your state or union territory."
  if (!form.district.trim()) errors.district = "Enter your district."

  if (!/^\d{6}$/.test(form.pincode)) errors.pincode = "Enter a 6-digit pincode."

  if (form.is_nri && !form.nri_country.trim())
    errors.nri_country = "Enter the country you are filing from."

  if (form.password.length < 8) errors.password = "Password must be at least 8 characters."
  else if (!/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password))
    errors.password = "Include at least one letter and one number."

  if (!form.otp_verified) errors.otp_verified = "Verify your mobile number with the OTP first."

  return errors
}

// Builds the exact POST /api/v1/auth/register request body.
export function buildRegisterPayload(form: RegistrationForm) {
  return {
    full_name: form.full_name.trim(),
    mobile_number: form.mobile_number,
    email: form.email.trim() || null,
    state: form.state,
    district: form.district.trim(),
    pincode: form.pincode,
    preferred_language: form.preferred_language,
    is_nri: form.is_nri,
    nri_country: form.is_nri ? form.nri_country.trim() : null,
    password: form.password ? "••••••••" : "", // never send plaintext to the JSON preview
    otp_verified: form.otp_verified,
    fcm_token: form.fcm_token,
  }
}

// Mocks the FastAPI RegisterResponse so the JSON output panel reflects the real contract.
export function buildRegisterResponse(form: RegistrationForm) {
  const masked =
    form.mobile_number.length === 10
      ? `XXXXXX${form.mobile_number.slice(-4)}`
      : "XXXXXXXXXX"

  return {
    success: true,
    user_id: "b7f3c1a2-9d4e-4c6a-8f21-3e5a7c9d1b0e",
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<access>.<sig>",
    refresh_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.<refresh>.<sig>",
    token_expiry_seconds: 900,
    user_profile: {
      full_name: form.full_name.trim() || "Ravi Kumar",
      mobile_number: masked,
      state: form.state || "Tamil Nadu",
      district: form.district.trim() || "Chennai",
      preferred_language: form.preferred_language,
    },
    onboarding_complete: false,
    next_step: "PROBLEM_INTAKE",
  }
}
