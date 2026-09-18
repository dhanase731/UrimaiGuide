import { NextResponse } from "next/server"
import { sendOtp } from "@/lib/otp"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const phone = body.phone || body.mobile_number || body.mobile

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Mobile phone number is required.",
        },
        { status: 400 }
      )
    }

    const result = await sendOtp(phone)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          code: result.code,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      message: result.message,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected server error occurred."
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    )
  }
}
