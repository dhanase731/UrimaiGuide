import twilio, { type Twilio } from "twilio"

/**
 * Server-side Twilio client initialization module.
 * Credentials are read strictly from server-side environment variables.
 * Never prefix these with NEXT_PUBLIC_ or hardcode SID / tokens.
 */

let cachedClient: Twilio | null = null

export function getTwilioConfig(): {
  accountSid: string
  authToken: string
  verifyServiceSid: string
} {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim().replace(/^["']|["']$/g, "")
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim().replace(/^["']|["']$/g, "")
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim().replace(/^["']|["']$/g, "")

  if (!accountSid || !authToken || !verifyServiceSid) {
    const missing: string[] = []
    if (!accountSid) missing.push("TWILIO_ACCOUNT_SID")
    if (!authToken) missing.push("TWILIO_AUTH_TOKEN")
    if (!verifyServiceSid) missing.push("TWILIO_VERIFY_SERVICE_SID")

    throw new Error(
      `Missing required Twilio environment variable(s): ${missing.join(", ")}. Please configure them in .env.local`
    )
  }

  return { accountSid, authToken, verifyServiceSid }
}

/**
 * Returns a singleton instance of the Twilio client initialized with server-side credentials.
 */
export function getTwilioClient(): Twilio {
  const { accountSid, authToken } = getTwilioConfig()

  if (!cachedClient) {
    cachedClient = twilio(accountSid, authToken)
  }

  return cachedClient
}

/**
 * Returns the configured Twilio Verify Service SID.
 */
export function getTwilioVerifyServiceSid(): string {
  const { verifyServiceSid } = getTwilioConfig()
  return verifyServiceSid
}
