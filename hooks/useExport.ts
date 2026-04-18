'use client'

import { useState, useCallback }                         from 'react'
import { useQuota }                                       from '@/hooks/useQuota'
import { checkExportAllowedWithPlan, incrementUsage }     from '@/lib/usage'
import type { ExportFormat, ExportProgress }              from '@/lib/export'

export interface UseExportReturn {
  progress:            ExportProgress
  isExporting:         boolean
  isBlocked:           boolean
  showUpgradeModal:    boolean
  setShowUpgradeModal: (v: boolean) => void
  run: (format: ExportFormat, pageCount: number, filename?: string) => Promise<void>
}

export function useExport(): UseExportReturn {
  const [progress, setProgress]                = useState<ExportProgress>({ phase: 'idle' })
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const quota     = useQuota()
  const isBlocked = quota.isAtLimit   // false for pro users

  const isExporting = progress.phase === 'capturing' || progress.phase === 'generating'

  const run = useCallback(async (
    format:    ExportFormat,
    pageCount: number,
    filename = 'inkify'
  ) => {
    if (isExporting) return

    // Quota gate — reads plan + usage fresh from localStorage
    // Pro users pass through immediately; free users checked against limit
    const blocked = checkExportAllowedWithPlan(pageCount)
    if (blocked) {
      setShowUpgradeModal(true)
      return
    }

    let succeeded = false
    try {
      if (format === 'pdf') {
        const { exportToPdf } = await import('@/lib/export')
        await exportToPdf({ filename, onProgress: setProgress })
      } else {
        const { exportToPng } = await import('@/lib/export')
        await exportToPng({ filename, onProgress: setProgress })
      }
      succeeded = true
    } catch {
      // error phase already set via onProgress
    } finally {
      // Only free users accumulate usage — pro users have no limit to track
      if (succeeded && !quota.isPro) {
        incrementUsage(pageCount)
      }
      setTimeout(() => setProgress({ phase: 'idle' }), 2000)
    }
  }, [isExporting, quota.isPro])

  return { progress, isExporting, isBlocked, showUpgradeModal, setShowUpgradeModal, run }
}
