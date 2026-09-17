import Image from "next/image"
import Link from "next/link"
import { KeyRound, UserPlus } from "lucide-react"

const NAV_LINKS = [
  { label: "How it works", href: "#workflow" },
  { label: "Capabilities", href: "#features" },
  { label: "Mission", href: "#mission" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-softborder bg-parchment/85 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-4 px-6 md:px-10 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/urimai-emblem.png"
            alt="Urimai emblem"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-bold tracking-tight text-ink-900">
              URIMAI
            </span>
            <span className="font-tamil text-xs text-amber-ink">உரிமை</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-700 transition-colors hover:text-ink-900"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-md border border-softborder px-3.5 py-2 text-sm font-semibold text-ink-900 transition-colors hover:bg-bluesoft"
          >
            <KeyRound className="h-4 w-4" />
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-md bg-ink-900 px-3.5 py-2 text-sm font-semibold text-parchment transition-colors hover:bg-ink-800"
          >
            <UserPlus className="h-4 w-4" />
            Start claim
          </Link>
        </div>
      </div>
    </header>
  )
}
