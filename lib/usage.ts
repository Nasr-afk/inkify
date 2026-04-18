/**
 * lib/usage.ts
 *
 * Single source of truth for export page usage.
 *
 * ── Storage ───────────────────────────────────────────────────────────────────
 * localStorage key: "inkify_pages_used"
 * value: raw integer string, e.g. "7"
 *
 * ── Design rules ─────────────────────────────────────────────────────────────
 * 1. Only exports increment usage — never typing, previewing, or page splits.
 * 2. Usage is incremented AFTER a confirmed successful export, never before.
 * 3. Failed exports do not touch usage.
 * 4. All reads return 0 when no value is stored (fresh user).
 *
 * ── Backend migration path ───────────────────────────────────────────────────
 * This module has no React dependency — it is plain TypeScript I/O.
 * To move to a backend, replace the four localStorage calls with API calls
 * and make getUsage / incrementUsage async. Nothing else in the codebase changes
 * because the hook layer (useQuota.ts) already handles the async boundary.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const STORAGE_KEY   = 'inkify_pages_used'
export const FREE_LIMIT    = 12
export const WARN_THRESHOLD = 2   // show warning when remaining ≤ this

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Safe localStorage read — returns 0 on SSR, missing key, or corrupt data */
function readRaw(): number {
  if (typeof window === 'undefined') return 0
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) return 0
  const parsed = parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

/** Write an integer to localStorage */
function writeRaw(value: number): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, String(Math.max(0, value)))
}

// ─── Pub-sub ──────────────────────────────────────────────────────────────────
//
// Lets useQuota() stay reactive without Zustand or a context provider.
// Any call to incrementUsage() or resetUsage() notifies all subscribers
// so the UI updates immediately.

type Listener = (usage: number) => void
const listeners = new Set<Listener>()

function notify(usage: number): void {
  listeners.forEach((fn) => fn(usage))
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get the total number of pages exported so far.
 * Returns 0 for a fresh user with no stored value.
 */
export function getUsage(): number {
  return readRaw()
}

/**
 * Add `pages` to the stored usage count.
 *
 * ONLY call this after a confirmed successful export.
 * Never call it speculatively or on failure.
 *
 * Notifies all useQuota() subscribers so the UI updates without a reload.
 */
export function incrementUsage(pages: number): void {
  if (pages <= 0) return
  const next = readRaw() + pages
  writeRaw(next)
  notify(next)
}

/**
 * How many pages the user can still export on the free plan.
 * Returns 0 when the limit is reached or exceeded.
 */
export function getRemainingPages(): number {
  return Math.max(0, FREE_LIMIT - readRaw())
}

/**
 * Check whether an export of `pageCount` pages would exceed the free limit.
 * Returns null if the export is allowed.
 * Returns a human-readable error string if it should be blocked.
 */
export function checkExportAllowed(pageCount: number): string | null {
  const used      = readRaw()
  const remaining = Math.max(0, FREE_LIMIT - used)

  if (remaining === 0) {
    return `You've reached your free limit of ${FREE_LIMIT} pages. Upgrade to continue.`
  }
  if (pageCount > remaining) {
    return `This export needs ${pageCount} ${pageCount === 1 ? 'page' : 'pages'} but you only have ${remaining} remaining.`
  }
  return null
}

/**
 * Reset usage to zero.
 * Intended for development and testing only — not exposed in production UI.
 */
export function resetUsage(): void {
  writeRaw(0)
  notify(0)
}

// ─── Plan storage ─────────────────────────────────────────────────────────────

export const PLAN_KEY = 'inkify_plan'
export type Plan = 'free' | 'pro'

type PlanListener = (plan: Plan) => void
const planListeners = new Set<PlanListener>()

function notifyPlan(plan: Plan): void {
  planListeners.forEach((fn) => fn(plan))
}

export function subscribePlan(fn: PlanListener): () => void {
  planListeners.add(fn)
  return () => planListeners.delete(fn)
}

/** Read the current plan from localStorage. Defaults to 'free'. */
export function getPlan(): Plan {
  if (typeof window === 'undefined') return 'free'
  const raw = window.localStorage.getItem(PLAN_KEY)
  return raw === 'pro' ? 'pro' : 'free'
}

/** Persist plan upgrade and notify subscribers. */
export function setPlan(plan: Plan): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PLAN_KEY, plan)
  notifyPlan(plan)
}

/**
 * Returns null if the export should proceed.
 * Returns a block reason string if it should be stopped.
 *
 * Pro users skip the quota gate entirely.
 */
export function checkExportAllowedWithPlan(pageCount: number): string | null {
  if (getPlan() === 'pro') return null          // pro: always allowed
  return checkExportAllowed(pageCount)           // free: apply page limit
}
