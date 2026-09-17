import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { LoginForm } from "@/components/login/login-form"

export const metadata: Metadata = {
  title: "Sign in — Urimai",
  description: "Returning citizen? Sign in to track your consumer court case.",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-parchment">
      <header className="border-b border-softborder">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/urimai-emblem.png"
              alt="Urimai emblem"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="flex flex-col leading-none">
              <span className="font-serif text-base font-bold tracking-tight text-ink-900">
                URIMAI
              </span>
              <span className="font-tamil text-xs text-amber-ink">உரிமை</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-ink">
            Returning citizen
          </p>
          <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-ink-900">
            Welcome back
          </h1>
          <p className="mt-2 leading-relaxed text-ink-700">
            Sign in to track your case, read court orders, and check compliance
            deadlines.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-sm text-ink-700">
            New citizen?{" "}
            <Link href="/register" className="font-semibold text-ink-900 underline underline-offset-2">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
