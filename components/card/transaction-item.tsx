"use client"

import { memo } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"
import { useLongPress } from "@/hooks/use-long-press"
import type { CardTransaction } from "@/lib/types"

interface TransactionItemProps {
  transaction: CardTransaction
  isSelected: boolean
  isSelectionMode: boolean
  onSelect: (id: string) => void
  onClick: (transaction: CardTransaction) => void
  onLongPress: (id: string) => void
}

export const TransactionItem = memo(function TransactionItem({
  transaction,
  isSelected,
  isSelectionMode,
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
      {...longPressHandlers}
      className={cn(
        "px-4 py-3 cursor-pointer transition-colors select-none",
        transaction.status === "반려" && "border-l-4 border-l-red-400 bg-red-50/30",
        isSelected && "bg-blue-50",
        !isSelected && "active:bg-gray-50"
      )}
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
          <div className="flex items-center justify-between mb-1">
            <StatusBadge status={transaction.status} />
            <span
              className={cn(
                "text-lg font-bold",
                transaction.amount < 0 ? "text-red-600" : "text-gray-900"
              )}
            >
              {formatAmount(transaction.amount)}원
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <p className="text-sm font-medium text-gray-800 truncate">
                {transaction.merchant}
              </p>
              <p className="text-xs text-gray-500">{transaction.businessType}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500">{transaction.date}</p>
              <p className="text-xs text-gray-400">{transaction.time}</p>
            </div>
          </div>
          {transaction.status === "반려" && transaction.rejectReason && (
            <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs text-red-600">
                <span className="font-semibold">반려 사유:</span> {transaction.rejectReason}
              </p>
            </div>
          )}
          {transaction.isCancelled && (
            <span className="inline-block mt-1 text-xs text-red-500 font-medium">
              결제취소건
            </span>
          )}
        </div>
      </div>
    </div>
  )
})
