import { NextRequest, NextResponse } from 'next/server'
import crypto                        from 'crypto'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VerifyBody {
  razorpay_order_id:   string
  razorpay_payment_id: string
  razorpay_signature:  string
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keySecret) {
    console.error('[verify-payment] Missing RAZORPAY_KEY_SECRET')
    return NextResponse.json(
      { error: 'Payment service not configured.' },
      { status: 503 }
    )
  }

  let body: VerifyBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { error: 'Missing required payment fields.' },
      { status: 400 }
    )
  }

  // ── Razorpay signature algorithm ──────────────────────────────────────────
  // expected_signature = HMAC-SHA256(key_secret, order_id + "|" + payment_id)
  const body_string = `${razorpay_order_id}|${razorpay_payment_id}`
  const expected    = crypto
    .createHmac('sha256', keySecret)
    .update(body_string)
    .digest('hex')

  // Constant-time comparison prevents timing attacks
  const sigBuffer  = Buffer.from(razorpay_signature, 'hex')
  const expBuffer  = Buffer.from(expected, 'hex')
  const isValid    = sigBuffer.length === expBuffer.length &&
                     crypto.timingSafeEqual(sigBuffer, expBuffer)

  if (!isValid) {
    console.warn('[verify-payment] Signature mismatch — possible tampered request')
    return NextResponse.json(
      { error: 'Payment verification failed.' },
      { status: 400 }
    )
  }

  // ── Signature valid — payment confirmed ───────────────────────────────────
  // In production you would also:
  //   1. Fetch the payment from Razorpay API and confirm status === 'captured'
  //   2. Write the upgrade to your database (users table, not just localStorage)
  //   3. Return a signed JWT / session token instead of trusting the client
  //
  // For now we return a success flag; the client writes the plan to localStorage.

  return NextResponse.json({
    verified: true,
    paymentId: razorpay_payment_id,
  })
}
