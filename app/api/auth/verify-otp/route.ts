import { NextResponse } from "next/server"
import { verifyOtp } from "@/lib/otp"
import { updatePhoneVerifiedInSupabase } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const phone = body.phone || body.mobile_number || body.mobile
    const code = body.code || body.otp

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Mobile phone number is required.",
        },
        { status: 400 }
      )
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Verification code is required.",
        },
        { status: 400 }
      )
    }

    const verifyResult = await verifyOtp(phone, code)

    if (!verifyResult.success || verifyResult.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: verifyResult.message,
          code: verifyResult.code,
        },
        { status: 400 }
      )
    }

    // Update phone_verified status in Supabase
    await updatePhoneVerifiedInSupabase(phone)

    return NextResponse.json({
      success: true,
      verified: true,
      status: "approved",
      message: verifyResult.message,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected server error occurred."
    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
