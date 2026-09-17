import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Roboto_Serif, Noto_Sans, Noto_Serif_Tamil } from 'next/font/google'
import './globals.css'
import { CaseProvider } from '@/lib/case-context'

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-noto-sans',
  display: 'swap',
})

const robotoSerif = Roboto_Serif({
  subsets: ['latin'],
  variable: '--font-roboto-serif',
  display: 'swap',
})

const notoSerifTamil = Noto_Serif_Tamil({
  subsets: ['tamil'],
  variable: '--font-noto-serif-tamil',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Urimai (உரிமை) — Your Right to Consumer Justice',
  description:
    'A sovereign legal guidance platform that walks every Indian citizen through filing, tracking, and enforcing a consumer court complaint — in Tamil, Hindi, or English.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#14213d',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`light bg-parchment ${notoSans.variable} ${robotoSerif.variable} ${notoSerifTamil.variable}`}
    >
      <body className="font-sans antialiased">
        <CaseProvider>
          {children}
        </CaseProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
