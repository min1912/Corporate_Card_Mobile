"use client"

import { useCallback, useRef } from "react"

interface UseLongPressOptions {
  onLongPress: () => void
  onClick?: () => void
  delay?: number
}

export function useLongPress({ onLongPress, onClick, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)
  const isScrollingRef = useRef(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const startTargetRef = useRef<HTMLElement | null>(null)

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isLongPressRef.current = false
    isScrollingRef.current = false
    startTargetRef.current = e.currentTarget as HTMLElement

    if ("touches" in e && e.touches.length > 0) {
      startXRef.current = e.touches[0].clientX
      startYRef.current = e.touches[0].clientY
    }

    timerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const clear = useCallback(
    (e: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }

      const shouldTrigger =
        shouldTriggerClick &&
        !isLongPressRef.current &&
        !isScrollingRef.current &&
        onClick

      if (shouldTrigger) {
        onClick()
      }
    },
    [onClick]
  )

  const move = useCallback((e: React.TouchEvent) => {
    if (!timerRef.current || isScrollingRef.current) return

    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - startXRef.current)
    const deltaY = Math.abs(touch.clientY - startYRef.current)
    const currentTarget = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null

    const isSameElement =
      startTargetRef.current &&
      currentTarget &&
      (startTargetRef.current === currentTarget || startTargetRef.current.contains(currentTarget))

    if (deltaX > 10 || deltaY > 10 || !isSameElement) {
      isScrollingRef.current = true
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e, true),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onTouchMove: (e: React.TouchEvent) => move(e),
    onTouchEnd: (e: React.TouchEvent) => clear(e, true),
    onTouchCancel: (e: React.TouchEvent) => clear(e, false),
  }
}
