"use client"

import { memo } from "react"
import { Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"
import { useLongPress } from "@/hooks/use-long-press"
import type { CardTransaction } from "@/lib/types"

interface TransactionItemProps {
  transaction: CardTransaction
  isSelected: boolean
  isSelectionMode: boolean
  isExiting?: boolean
  onSelect: (id: string) => void
  onClick: (transaction: CardTransaction) => void
  onLongPress: (id: string) => void
}

export const TransactionItem = memo(function TransactionItem({
  transaction,
  isSelected,
  isSelectionMode,
  isExiting = false,
  onSelect,
  onClick,
  onLongPress,
}: TransactionItemProps) {
  const longPressHandlers = useLongPress({
    onLongPress: () => onLongPress(transaction.id),
    onClick: () => {
      if (isSelectionMode) {
        onSelect(transaction.id)
      } else {
        onClick(transaction)
      }
    },
  })

  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString()
    return amount < 0 ? `-${formatted}` : formatted
  }

  return (
    <div
      className={cn(
        "grid transition-all duration-300 ease-in-out border-gray-100",
        isExiting ? "opacity-0 border-transparent" : "opacity-100 border-b last:border-b-0"
      )}
      style={{ gridTemplateRows: isExiting ? "0fr" : "1fr" }}
    >
      <div className="overflow-hidden min-h-0">
        <div
          {...longPressHandlers}
          className={cn(
            "px-4 py-3 cursor-pointer transition-colors select-none",
            transaction.status === "반려" && "bg-red-50/50",
            isSelected && "bg-blue-50",
            !isSelected && "active:bg-gray-50"
          )}
          style={{ touchAction: "pan-y", WebkitUserSelect: "none" }}
        >
          <div className="flex items-start gap-3">
        {isSelectionMode && (
          <div className="pt-1 flex-shrink-0">
            <div
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
              )}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          {/* 상단: 사용처와 금액 */}
          <div className="flex items-start justify-between mb-1.5 gap-3">
            <p className="text-base font-bold text-gray-900 line-clamp-2 break-keep">
              {transaction.merchant}
            </p>
            <span
              className={cn(
                "text-lg font-bold flex-shrink-0 whitespace-nowrap leading-tight",
                transaction.amount < 0 ? "text-red-600" : "text-gray-900"
              )}
            >
              {formatAmount(transaction.amount)}원
            </span>
          </div>
          {/* 하단: 상태 뱃지, 업종, 날짜/시간 */}
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2 min-w-0 mr-2">
              <StatusBadge status={transaction.status} />
              <span className="text-sm font-medium text-gray-700 truncate">{transaction.businessType}</span>
              {transaction.businessType === "통신판매업" && (
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              )}
            </div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 whitespace-nowrap flex-shrink-0">
            {transaction.isCancelled && (
              <span className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md font-medium">
                결제취소
              </span>
            )}
            <span>{transaction.time}</span>
            </div>
          </div>
          {transaction.status === "반려" && transaction.rejectReason && (
            <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs text-red-600">
                <span className="font-semibold">반려 사유:</span> {transaction.rejectReason}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
      </div>
    </div>
  )
})
