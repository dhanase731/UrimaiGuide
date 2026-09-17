import Image from "next/image"

const COLUMNS = [
  {
    heading: "Platform",
    links: ["How it works", "Capabilities", "Languages", "Security"],
  },
  {
    heading: "Statutory",
    links: ["Consumer Protection Act 2019", "Jurisdiction", "Limitation", "e-Jagriti"],
  },
  {
    heading: "Governance",
    links: ["DPDP Act 2023", "Privacy", "Data purge", "Contact"],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-softborder bg-ink-900 text-parchment">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/urimai-emblem.png"
                alt="Urimai emblem"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="flex flex-col leading-none">
                <span className="font-serif text-lg font-bold tracking-tight">
                  URIMAI
                </span>
                <span className="font-tamil text-xs text-amber-100/80">
                  உரிமை
                </span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-parchment/60">
              A sovereign legal guidance platform for consumer justice — in
              Tamil, Hindi, and English.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-sm font-semibold text-parchment">
                {column.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-parchment/60 transition-colors hover:text-parchment"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-parchment/15 pt-6 text-xs text-parchment/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Urimai. A prototype for consumer justice.</p>
          <p>Data encrypted at rest (AES-256) under India DPDP Act 2023.</p>
        </div>
      </div>
    </footer>
  )
}
