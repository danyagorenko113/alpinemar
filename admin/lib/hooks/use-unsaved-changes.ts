'use client'

import { useEffect } from 'react'

/**
 * Warns the user when they try to leave the page (close tab, back button,
 * full-page nav) while `dirty` is true.
 *
 * Note: This handles browser-level unloads. Intra-app router.push() calls
 * bypass this — the form should reset `dirty` to false right before it
 * calls router.push(). See services-form.tsx handleSave() for the pattern.
 */
export function useUnsavedChanges(dirty: boolean, message?: string) {
  useEffect(() => {
    if (!dirty) return
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      // Modern browsers ignore the custom message and show their own.
      e.returnValue = message ?? 'You have unsaved changes.'
      return e.returnValue
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty, message])
}
