"use client"

import { memo, useEffect } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertCircle, Info } from "lucide-react"

interface ToastNotificationProps {
  message: string
  type?: "success" | "error" | "info"
  visible: boolean
  onHide: () => void
  duration?: number
}

export const ToastNotification = memo(function ToastNotification({
  message,
  type = "success",
  visible,
  onHide,
  duration = 2000,
}: ToastNotificationProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onHide])

  if (!visible) return null

  const Icon = type === "success" ? CheckCircle : type === "error" ? AlertCircle : Info
  const colors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
    info: "bg-sky-50 border-sky-200 text-sky-900",
  }

  return (
    <div className="absolute inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className={cn(
          "w-full max-w-[340px] flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium",
          colors[type]
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  )
})
