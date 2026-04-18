# Inkify

A handwriting workspace that converts typed text into natural-looking handwritten pages, ready to export as PDF or PNG.

## Quick start

```bash
cp .env.example .env.local   # add your Razorpay keys
npm install
npm run dev                  # http://localhost:3000
```

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Handwriting engine | Custom PRNG-based renderer |
| Export | html2canvas + jsPDF |
| Payments | Razorpay |

## Project structure

```
inkify/
│
├── app/
│   ├── api/
│   │   ├── create-order/route.ts   # Razorpay order creation
│   │   └── verify-payment/route.ts # HMAC-SHA256 signature verification
│   ├── layout.tsx                  # Root layout + Google Fonts (runtime link)
│   ├── page.tsx                    # Entry point → SplitWorkspace
│   └── globals.css
│
├── components/
│   ├── Navbar.tsx                  # Logo + export button + quota badge
│   ├── QuotaCounter.tsx            # Pages-remaining badge (free/pro)
│   └── editor/
│       ├── SplitWorkspace.tsx      # Root layout: editor | preview + controls
│       ├── TextEditor.tsx          # WYSIWYG textarea (mirrors font/color)
│       ├── PreviewPane.tsx         # Paginated page stack with auto-scaling
│       ├── Page.tsx                # Single A4 page (794×1123px) with rules
│       └── ControlsPanel.tsx       # Font, size, color, messiness controls
│   └── ui/
│       ├── Button.tsx
│       ├── Tooltip.tsx
│       ├── Divider.tsx
│       └── UpgradeModal.tsx        # Razorpay upgrade flow
│
├── hooks/
│   ├── useEditor.ts          # Reads InkifyStore, derives fontFamily
│   ├── useDebounce.ts        # 300ms text debounce for preview
│   ├── useContainerWidth.ts  # ResizeObserver — drives page auto-scale
│   ├── useQuota.ts           # Reactive wrapper over lib/usage.ts
│   ├── useExport.ts          # Export pipeline + quota enforcement
│   ├── useRazorpay.ts        # Full Razorpay checkout + verification flow
│   └── useKeyboard.ts        # Global keyboard shortcuts
│
├── lib/
│   ├── handwritingEngine.ts  # Core renderer: seeded PRNG, 5 transform layers
│   ├── paginator.ts          # Word-wrap → line-group → page-slice algorithm
│   ├── fonts.ts              # Single source of truth for all font metadata
│   ├── usage.ts              # localStorage I/O for quota + plan (inkify_pages_used)
│   ├── export.ts             # html2canvas + jsPDF multi-page export
│   ├── utils.ts              # cn(), generateId(), clamp(), etc.
│   └── store/
│       ├── useInkifyStore.ts # Editor state (text, font, size, color, messiness)
│       └── useCanvasStore.ts # Canvas element state
│
└── .env.example              # Razorpay key placeholders
```

## Handwriting engine

`lib/handwritingEngine.ts` simulates natural writing using two passes:

**Pass 1 — local transforms** (per-character, independent)
Each character is seeded with `mulberry32(Knuth_hash(charIndex))`. Same text always produces the same output. Rotation, scale, opacity.

**Pass 2 — sequential context** (stateful, forward pass)
- Baseline drift: sinusoidal wave + bounded random walk
- Cluster rhythm: alternating tight/loose letter groups (3–5 chars)
- Word-space imperfection: ±variation on each space
- Line-break resets: horizontal nudge + partial drift reset

All effects scale linearly with `messiness` (0–100).

## Monetization

- **Free plan**: 12 exported pages total (stored in `localStorage: inkify_pages_used`)
- **Pro plan**: Unlimited exports, one-time payment of ₹199 via Razorpay
- Plan stored in `localStorage: inkify_plan`

Payment flow:
1. `POST /api/create-order` — creates Razorpay order server-side
2. Razorpay checkout modal opens in the browser
3. `POST /api/verify-payment` — HMAC-SHA256 signature check
4. On success: `setPlan('pro')` written to localStorage

## Razorpay setup

1. Create an account at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Copy your test keys from Settings → API Keys
3. Add to `.env.local`:

```bash
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

Switch to live keys (`rzp_live_...`) when going to production.

## Export

- **PDF**: All pages combined into one document (JPEG at 0.95 quality, ~1–2 MB/page)
- **PNG**: Page 1 at 2× resolution

Exports are gated by quota. Pro users export without limit.

## Scripts

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check (CI)
```

## Environment variables

| Variable | Where used | Description |
|----------|-----------|-------------|
| `RAZORPAY_KEY_ID` | API routes (server) | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | API routes (server) | Razorpay secret — never expose to client |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Browser | Passed to Razorpay checkout SDK |
