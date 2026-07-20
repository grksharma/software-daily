import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Wires up the accessibility behavior a modal dialog is expected to have:
 * Escape to dismiss, focus moved inside on open and restored on close, Tab
 * cycling kept within the dialog, and the page behind it locked from scrolling.
 *
 * `initialFocus` is an optional selector for the element that should receive
 * focus on open — use it for form dialogs, where landing on the close button
 * would make a keyboard user tab past it to reach the first field.
 *
 * Returns a ref to attach to the dialog element.
 */
export function useDialog(isOpen, onClose, initialFocus) {
  const dialogRef = useRef(null)
  const lastFocusedRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    // Remember what had focus so it can be handed back on close.
    lastFocusedRef.current = document.activeElement
    const dialog = dialogRef.current
    const preferred = initialFocus ? dialog?.querySelector(initialFocus) : null
    ;(preferred ?? dialog?.querySelector(FOCUSABLE))?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return

      const focusable = [...dialog.querySelectorAll(FOCUSABLE)]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    // Compensate for the vanishing scrollbar so the layout behind doesn't shift.
    const { overflow, paddingRight } = document.body.style
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      lastFocusedRef.current?.focus?.()
    }
  }, [isOpen, onClose, initialFocus])

  return dialogRef
}
