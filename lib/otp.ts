import { getTwilioClient, getTwilioVerifyServiceSid } from "./twilio"
import { validatePhoneNumber } from "./phone"

export interface SendOtpResult {
  success: boolean
  status?: string
  sid?: string
  to?: string
  message: string
  code?: number | string
}

export interface VerifyOtpResult {
  success: boolean
  status?: "approved" | "pending" | "canceled" | string
  sid?: string
  to?: string
  message: string
  code?: number | string
}

interface TwilioRestError extends Error {
  status?: number
  code?: number
  moreInfo?: string
  details?: unknown
}

function mapTwilioError(err: unknown, fallbackMessage: string): { message: string; code?: number } {
  if (!err || typeof err !== "object") {
    return { message: fallbackMessage }
  }

  const twErr = err as TwilioRestError
  const twCode = twErr.code

  switch (twCode) {
    case 60200:
    case 21211:
    case 21614:
      return {
        message: "Invalid phone number format. Please provide a valid mobile number with country code.",
        code: twCode,
      }
    case 21608:
      return {
        message:
          "This phone number is unverified on your Twilio Trial account. Please verify the destination number in Twilio Console or upgrade your Twilio account.",
        code: twCode,
      }
    case 60202:
      return {
        message: "Maximum verification check attempts reached. Please request a new OTP code.",
        code: twCode,
      }
    case 60203:
      return {
        message: "Maximum OTP send attempts reached for this phone number. Please try again later.",
        code: twCode,
      }
    case 20404:
      return {
        message: "Verification code has expired or was not found. Please request a new OTP.",
        code: twCode,
      }
    case 60212:
    case 20429:
      return {
        message: "Too many attempts. Please wait a moment before trying again.",
        code: twCode,
      }
    default:
      return {
        message: twErr.message || fallbackMessage,
        code: twCode,
      }
  }
}

/**
 * Sends an SMS verification code to the specified phone number via Twilio Verify API.
 * The OTP code is generated and transmitted strictly by Twilio.
 */
export async function sendOtp(phone: string): Promise<SendOtpResult> {
  const phoneValidation = validatePhoneNumber(phone)
  if (!phoneValidation.isValid) {
    return {
      success: false,
      message: phoneValidation.error || "Invalid phone number.",
    }
  }

  const formattedPhone = phoneValidation.e164

  try {
    const client = getTwilioClient()
    const serviceSid = getTwilioVerifyServiceSid()

    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: formattedPhone,
        channel: "sms",
      })

    return {
      success: true,
      status: verification.status,
      sid: verification.sid,
      to: verification.to,
      message: `OTP sent successfully via SMS to ${formattedPhone}.`,
    }
  } catch (error: unknown) {
    console.error("[Twilio sendOtp Error]:", error)
    const { message, code } = mapTwilioError(error, "Failed to send OTP. Please try again.")
    return {
      success: false,
      message,
      code,
    }
  }
}

/**
 * Verifies the OTP code provided by the user using Twilio Verify API.
 */
export async function verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
  const phoneValidation = validatePhoneNumber(phone)
  if (!phoneValidation.isValid) {
    return {
      success: false,
      message: phoneValidation.error || "Invalid phone number.",
    }
  }

  const formattedPhone = phoneValidation.e164
  const sanitizedCode = (code || "").trim()

  if (!sanitizedCode || !/^\d{4,10}$/.test(sanitizedCode)) {
    return {
      success: false,
      message: "Please enter a valid numeric verification code.",
    }
  }

  try {
    const client = getTwilioClient()
    const serviceSid = getTwilioVerifyServiceSid()

    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: formattedPhone,
        code: sanitizedCode,
      })

    if (verificationCheck.status === "approved") {
      return {
        success: true,
        status: "approved",
        sid: verificationCheck.sid,
        to: verificationCheck.to,
        message: "Mobile number verified successfully.",
      }
    }

    return {
      success: false,
      status: verificationCheck.status,
      sid: verificationCheck.sid,
      to: verificationCheck.to,
      message: "Invalid or expired verification code. Please check and try again.",
    }
  } catch (error: unknown) {
    console.error("[Twilio verifyOtp Error]:", error)
    const { message, code } = mapTwilioError(
      error,
      "Verification failed. The code may be invalid or expired."
    )
    return {
      success: false,
      message,
      code,
    }
  }
}
