'use client'

import { useState, useEffect } from 'react'
import {
  getUsage,
  subscribe,
  FREE_LIMIT,
  WARN_THRESHOLD,
  getPlan,
  subscribePlan,
  type Plan,
} from '@/lib/usage'

export interface QuotaStatus {
  used:       number
  remaining:  number
  limit:      number
  canExport:  boolean
  isAtLimit:  boolean
  isWarning:  boolean
  plan:       Plan
  isPro:      boolean
}

function derive(used: number, plan: Plan): QuotaStatus {
  const isPro      = plan === 'pro'
  const remaining  = isPro ? Infinity : Math.max(0, FREE_LIMIT - used)
  return {
    used,
    remaining:  isPro ? Infinity : remaining,
    limit:      isPro ? Infinity : FREE_LIMIT,
    canExport:  isPro ? true : remaining > 0,
    isAtLimit:  isPro ? false : remaining === 0,
    isWarning:  isPro ? false : remaining > 0 && remaining <= WARN_THRESHOLD,
    plan,
    isPro,
  }
}

export function useQuota(): QuotaStatus {
  const [used, setUsed] = useState<number>(0)
  const [plan, setPlanState] = useState<Plan>('free')

  useEffect(() => {
    setUsed(getUsage())
    setPlanState(getPlan())

    const unsubUsage = subscribe((next) => setUsed(next))
    const unsubPlan  = subscribePlan((next) => setPlanState(next))

    function onStorage(e: StorageEvent) {
      if (e.key === 'inkify_pages_used') setUsed(getUsage())
      if (e.key === 'inkify_plan')       setPlanState(getPlan())
    }
    window.addEventListener('storage', onStorage)

    return () => {
      unsubUsage()
      unsubPlan()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return derive(used, plan)
}
