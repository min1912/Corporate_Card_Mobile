"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"
import type { TransactionStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: TransactionStatus
}

const statusStyles: Record<TransactionStatus, string> = {
  미처리: "bg-amber-100 text-amber-700",
  결재진행: "bg-blue-100 text-blue-700",
  결재완료: "bg-indigo-100 text-indigo-700",
  회계승인: "bg-teal-100 text-teal-700",
  지급완료: "bg-green-100 text-green-700",
  개인사용: "bg-gray-100 text-gray-600",
  취소처리: "bg-slate-100 text-slate-500",
  반려: "bg-red-100 text-red-700",
}

export const StatusBadge = memo(function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        statusStyles[status]
      )}
    >
      {status}
    </span>
  )
})
