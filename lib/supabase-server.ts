import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { formatToE164 } from "./phone"

/**
 * Server-side Supabase client initialization.
 * Uses SUPABASE_SERVICE_ROLE_KEY for administrative access where available,
 * falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
let supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes("<project-ref>")) {
    return null
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseAdmin
}

/**
 * Updates the user's phone_verified status in Supabase after Twilio Verify approval.
 * Attempts to update matching records in 'users' and 'profiles' tables.
 */
export async function updatePhoneVerifiedInSupabase(phone: string): Promise<{
  success: boolean
  updated: boolean
  message: string
}> {
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    console.info(
      "[Supabase] Supabase credentials not configured in environment. Skipping database update."
    )
    return {
      success: true,
      updated: false,
      message: "Supabase not configured in current environment.",
    }
  }

  const e164 = formatToE164(phone)
  const raw10Digits = phone.replace(/\D/g, "").slice(-10)

  try {
    // Attempt updating in 'users' table by phone / mobile_number
    const { error: usersError, count: usersCount } = await supabase
      .from("users")
      .update({
        phone_verified: true,
        updated_at: new Date().toISOString(),
      })
      .or(`mobile_number.eq.${raw10Digits},mobile_number.eq.${e164},phone.eq.${raw10Digits},phone.eq.${e164}`)

    if (usersError && usersError.code !== "PGRST116" && usersError.code !== "42P01") {
      console.warn("[Supabase] Notice when updating users table:", usersError.message)
    }

    // Also attempt updating in 'profiles' table if it exists
    const { error: profilesError } = await supabase
      .from("profiles")
      .update({
        phone_verified: true,
        updated_at: new Date().toISOString(),
      })
      .or(`mobile_number.eq.${raw10Digits},mobile_number.eq.${e164},phone.eq.${raw10Digits},phone.eq.${e164}`)

    if (profilesError && profilesError.code !== "PGRST116" && profilesError.code !== "42P01") {
      console.warn("[Supabase] Notice when updating profiles table:", profilesError.message)
    }

    return {
      success: true,
      updated: (usersCount ?? 0) > 0,
      message: "Phone verified status updated in Supabase.",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown Supabase error"
    console.warn("[Supabase] Could not update phone_verified status:", message)
    return {
      success: true, // Verification itself succeeded on Twilio
      updated: false,
      message: `Database sync note: ${message}`,
    }
  }
}
