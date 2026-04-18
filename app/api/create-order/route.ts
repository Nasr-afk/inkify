import { NextResponse } from 'next/server'
import Razorpay         from 'razorpay'

// ─── Config ───────────────────────────────────────────────────────────────────

/** One-time unlock price in paise (₹199 = 19900 paise) */
const AMOUNT_PAISE = 19900
const CURRENCY     = 'INR'

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST() {
  const keyId     = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    console.error('[create-order] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET')
    return NextResponse.json(
      { error: 'Payment service not configured.' },
      { status: 503 }
    )
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })

    const order = await razorpay.orders.create({
      amount:   AMOUNT_PAISE,
      currency: CURRENCY,
      // receipt ties the order to a logical "product" for your records
      receipt:  `inkify_pro_${Date.now()}`,
      notes: {
        product: 'Inkify Pro',
        plan:    'lifetime',
      },
    })

    return NextResponse.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId,    // safe to return — this is the public key_id, not the secret
    })

  } catch (err) {
    console.error('[create-order] Razorpay error:', err)
    return NextResponse.json(
      { error: 'Failed to create payment order. Please try again.' },
      { status: 500 }
    )
  }
}
