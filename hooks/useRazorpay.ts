'use client'

import { useState, useCallback } from 'react'
import { setPlan }                from '@/lib/usage'

// ─── Razorpay browser SDK types ───────────────────────────────────────────────
// The SDK is loaded dynamically via a script tag — not installed as a package.

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key:          string
  amount:       number
  currency:     string
  name:         string
  description:  string
  order_id:     string
  prefill?:     { name?: string; email?: string; contact?: string }
  theme?:       { color?: string }
  handler:      (response: RazorpayResponse) => void
  modal?:       { ondismiss?: () => void }
}

interface RazorpayResponse {
  razorpay_payment_id:  string
  razorpay_order_id:    string
  razorpay_signature:   string
}

interface RazorpayInstance {
  open: () => void
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type UpgradePhase =
  | 'idle'
  | 'creating-order'    // calling /api/create-order
  | 'checkout'          // Razorpay modal is open
  | 'verifying'         // calling /api/verify-payment
  | 'success'
  | 'error'

export interface UseRazorpayReturn {
  phase:     UpgradePhase
  error:     string | null
  startUpgrade: () => Promise<void>
}

// ─── Script loader ────────────────────────────────────────────────────────────

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return }

    const script  = document.createElement('script')
    script.src    = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async  = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout SDK.'))
    document.body.appendChild(script)
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Orchestrates the full Razorpay payment flow:
 *   1. Load checkout.js (lazy, only on first upgrade click)
 *   2. POST /api/create-order → get order_id
 *   3. Open Razorpay modal
 *   4. On payment success → POST /api/verify-payment (HMAC check)
 *   5. On verification OK → setPlan('pro') in localStorage
 */
export function useRazorpay(): UseRazorpayReturn {
  const [phase, setPhase] = useState<UpgradePhase>('idle')
  const [error, setError] = useState<string | null>(null)

  const startUpgrade = useCallback(async () => {
    setError(null)
    setPhase('creating-order')

    try {
      // ── 1. Load Razorpay SDK ────────────────────────────────────────────
      await loadRazorpayScript()

      // ── 2. Create order on our server ──────────────────────────────────
      const orderRes = await fetch('/api/create-order', { method: 'POST' })
      if (!orderRes.ok) {
        const { error: msg } = await orderRes.json()
        throw new Error(msg ?? 'Could not create payment order.')
      }
      const { orderId, amount, currency, keyId } = await orderRes.json()

      // ── 3. Open Razorpay checkout modal ────────────────────────────────
      setPhase('checkout')

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:         keyId,
          amount,
          currency,
          name:        'Inkify',
          description: 'Pro Plan — Lifetime access',
          order_id:    orderId,
          theme:       { color: '#7c3aed' },
          handler: async (response) => {
            // ── 4. Verify signature server-side ──────────────────────────
            setPhase('verifying')
            try {
              const verifyRes = await fetch('/api/verify-payment', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                  razorpay_order_id:   response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature:  response.razorpay_signature,
                }),
              })

              if (!verifyRes.ok) {
                const { error: msg } = await verifyRes.json()
                throw new Error(msg ?? 'Payment verification failed.')
              }

              // ── 5. Grant pro access ─────────────────────────────────
              setPlan('pro')
              setPhase('success')
              resolve()

            } catch (err) {
              reject(err)
            }
          },
          modal: {
            ondismiss: () => {
              // User closed the modal without paying — not an error
              setPhase('idle')
              resolve()
            },
          },
        })

        rzp.open()
      })

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.'
      setError(msg)
      setPhase('error')
    }
  }, [])

  return { phase, error, startUpgrade }
}
