/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  // Strip X-Powered-By header — no need to advertise the stack
  poweredByHeader: false,

  // Strict React mode — catches double-render bugs in development
  reactStrictMode: true,

  // ── Security headers ────────────────────────────────────────────────────────
  // Applied to every route. Tighten CSP further once you know all
  // third-party origins (e.g. Razorpay CDN, Google Fonts).
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options',        value: 'DENY' },
          // Prevent MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer — only send origin on cross-origin requests
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
          // Permissions — disable features Inkify doesn't need
          { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS — force HTTPS for 1 year (Vercel sets this automatically,
          // but explicit is better than implicit)
          {
            key:   'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Content Security Policy
          // script-src: self + Razorpay checkout SDK
          // style-src: self + unsafe-inline (Tailwind inline styles) + Google Fonts
          // font-src: self + Google Fonts CDN
          // connect-src: self + Razorpay API
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://checkout.razorpay.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com",
              "frame-src https://api.razorpay.com https://*.razorpay.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
