# Deployment Guide

## Prerequisites

- [Vercel account](https://vercel.com/signup) (free tier works)
- [GitHub account](https://github.com) with the Inkify repo pushed
- [Razorpay account](https://dashboard.razorpay.com) with API keys

---

## 1 — Push to GitHub

```bash
cd inkify
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/inkify.git
git push -u origin main
```

---

## 2 — Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your `inkify` repo
4. Vercel auto-detects Next.js — keep default settings
5. Click **Deploy** (first deploy will fail — env vars not set yet)

---

## 3 — Set environment variables

In the Vercel dashboard → your project → **Settings → Environment Variables**:

| Variable | Value | Environments |
|----------|-------|-------------|
| `RAZORPAY_KEY_ID` | `rzp_live_xxxxxxxxxxxx` | Production |
| `RAZORPAY_KEY_ID` | `rzp_test_xxxxxxxxxxxx` | Preview, Development |
| `RAZORPAY_KEY_SECRET` | `xxxxxxxxxxxxxxxxxxxxxxxx` | All |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_xxxxxxxxxxxx` | Production |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_xxxxxxxxxxxx` | Preview, Development |

> **Never** put `RAZORPAY_KEY_SECRET` in a `NEXT_PUBLIC_` variable.

After saving, trigger a redeploy:
**Deployments → Latest deployment → ⋯ → Redeploy**

---

## 4 — Verify HTTPS

Vercel provisions a TLS certificate automatically for:
- `your-project.vercel.app` (free SSL, auto-renews)
- Any custom domain you add

To add a custom domain:
1. **Settings → Domains → Add**
2. Follow the DNS instructions (add CNAME or A record at your registrar)
3. Vercel handles cert issuance via Let's Encrypt

---

## 5 — Smoke test in production

After deploy, open your live URL and test:

### Editor
- [ ] Type text — textarea accepts input
- [ ] Font switcher changes editor and preview font
- [ ] Font size stepper updates both panes
- [ ] Color picker updates ink color
- [ ] Messiness slider changes preview character jitter

### Preview
- [ ] Preview updates ~300ms after typing stops
- [ ] Multiple pages appear for long text
- [ ] Zoom controls (Fit / 50% / 75% / 100%) work
- [ ] Pages don't overflow the pane horizontally

### Export
- [ ] Export dropdown opens
- [ ] PDF export downloads a multi-page file
- [ ] PNG export downloads page 1
- [ ] Quota counter decrements after each export
- [ ] Reaching 12 pages blocks export and shows modal

### Monetization
- [ ] Upgrade modal opens from quota counter (at limit)
- [ ] Razorpay test payment flow completes (use card `4111 1111 1111 1111`)
- [ ] After payment: navbar shows "Pro Plan" badge
- [ ] After payment: export works without limit

### Mobile (test on real device or DevTools)
- [ ] Editor and Preview tabs switch correctly
- [ ] Textarea doesn't auto-zoom on iOS (font ≥ 16px)
- [ ] Controls panel scrolls horizontally if needed
- [ ] Export works (downloads file)
- [ ] Upgrade modal usable on small screen

---

## 6 — Razorpay webhook (optional, for robust pro unlock)

The current implementation trusts the client to write `inkify_plan = "pro"` after server-side signature verification. This is secure against forgery but not against network failures mid-payment.

For production robustness, add a webhook:

1. Razorpay Dashboard → **Settings → Webhooks → Add New**
2. URL: `https://your-domain.vercel.app/api/webhook`
3. Events: `payment.captured`
4. Create `/app/api/webhook/route.ts` that:
   - Verifies the `X-Razorpay-Signature` header
   - Stores the upgrade in a database (Supabase, PlanetScale, etc.)
   - Returns a server-authoritative "pro" flag instead of trusting localStorage

---

## 7 — Go live checklist

- [ ] Switch Razorpay keys from `rzp_test_` to `rzp_live_`
- [ ] Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` to live key in Vercel env vars
- [ ] Test a real ₹199 payment end-to-end
- [ ] Remove the `[dev] Reset usage` button from `UpgradeModal.tsx`
  (it only renders in `NODE_ENV === 'development'` but clean it up anyway)
- [ ] Set up error monitoring (Sentry, Vercel Analytics, or similar)
- [ ] Enable Vercel Speed Insights for Core Web Vitals tracking

---

## Environment variables reference

| Variable | Server/Client | Purpose |
|----------|--------------|---------|
| `RAZORPAY_KEY_ID` | Server only | Creates orders via Razorpay API |
| `RAZORPAY_KEY_SECRET` | Server only | Signs/verifies payment HMAC |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Browser | Passed to Razorpay checkout SDK |
