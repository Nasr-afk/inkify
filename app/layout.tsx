import type { Metadata, Viewport } from 'next'
import { GOOGLE_FONT_NAMES }       from '@/lib/fonts'
import './globals.css'

// ─── Viewport ─────────────────────────────────────────────────────────────────
// Exported separately from metadata per Next.js 14 convention.
// - width=device-width, initial-scale=1: standard responsive baseline
// - maximum-scale=1: prevent iOS auto-zoom on input focus
//   (safe here because we manually set font-size ≥ 16px on all inputs)
// - theme-color: colours the browser chrome on Android

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor:   '#7c3aed',
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:       'Inkify — Handwriting in your browser',
  description: 'Type your text and watch it transform into natural handwriting. Export to PDF or PNG.',
  keywords:    ['handwriting', 'handwritten text', 'PDF export', 'writing tool'],
  authors:     [{ name: 'Inkify' }],
  robots:      'index, follow',
  icons:       { icon: '/favicon.ico' },
  openGraph: {
    title:       'Inkify — Handwriting in your browser',
    description: 'Type your text and watch it transform into natural handwriting.',
    type:        'website',
    locale:      'en_US',
  },
}

// ─── Google Fonts ─────────────────────────────────────────────────────────────
// Loaded via <link> at runtime — not next/font/google — so the build step
// never fetches fonts.googleapis.com (which fails in offline/CI environments).

function googleFontsUrl(): string {
  const families = GOOGLE_FONT_NAMES
    .map((name) => `family=${name}:wght@400;600`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={googleFontsUrl()} />
      </head>
      <body>{children}</body>
    </html>
  )
}
