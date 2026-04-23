"use client"

import { memo, useState, useMemo, useCallback } from "react"
import { ChevronLeft, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"
import type { CardTransaction } from "@/lib/types"

interface CancelMatchModalProps {
  currentTransaction: CardTransaction
  matchingTransactions: CardTransaction[]
  onConfirm: (selectedIds: string[]) => void
  onClose: () => void
}

export const CancelMatchModal = memo(function CancelMatchModal({
  currentTransaction,
  matchingTransactions,
  onConfirm,
  onClose,
}: CancelMatchModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([currentTransaction.id])

  const toggleSelection = useCallback((id: string) => {
    if (id === currentTransaction.id) return // 현재 거래는 선택 해제 불가
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [currentTransaction.id])

  const selectedTransactions = useMemo(() => {
    return [currentTransaction, ...matchingTransactions].filter((t) =>
      selectedIds.includes(t.id)
    )
  }, [currentTransaction, matchingTransactions, selectedIds])

  const totalAmount = useMemo(() => {
    return selectedTransactions.reduce((sum, t) => sum + t.amount, 0)
  }, [selectedTransactions])

  const canProceed = totalAmount === 0

  const handleConfirm = useCallback(() => {
    if (canProceed) {
      onConfirm(selectedIds)
    }
  }, [canProceed, selectedIds, onConfirm])

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button onClick={onClose} className="p-1 -ml-1" aria-label="뒤로가기">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900">취소처리</h1>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-700">
            <p className="font-medium mb-1">취소처리 안내</p>
            <p>동일한 사용처와 승인번호를 가진 결제내역 중 금액 합계가 0이 되는 건들을 선택하세요.</p>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Current Transaction */}
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded border-2 bg-blue-600 border-blue-600 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <StatusBadge status={currentTransaction.status} />
                  <span
                    className={cn(
                      "text-sm font-bold",
                      currentTransaction.amount < 0 ? "text-red-600" : "text-gray-900"
                    )}
                  >
                    {currentTransaction.amount.toLocaleString()}원
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {currentTransaction.date} {currentTransaction.time}
                </p>
              </div>
            </div>
          </div>

          {/* Matching Transactions */}
          {matchingTransactions.map((transaction) => {
            const isSelected = selectedIds.includes(transaction.id)
            return (
              <button
                key={transaction.id}
                onClick={() => toggleSelection(transaction.id)}
                className={cn(
                  "w-full px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors",
                  isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300 bg-white"
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <StatusBadge status={transaction.status} />
                      <span
                        className={cn(
                          "text-sm font-bold",
                          transaction.amount < 0 ? "text-red-600" : "text-gray-900"
                        )}
                      >
                        {transaction.amount.toLocaleString()}원
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {transaction.date} {transaction.time}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}

          {matchingTransactions.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              동일한 승인번호의 다른 결제내역이 없습니다
            </div>
          )}
        </div>
      </div>

      {/* Summary & Action */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">선택 금액 합계</span>
          <span
            className={cn(
              "text-lg font-bold",
              totalAmount === 0
                ? "text-green-600"
                : totalAmount < 0
                ? "text-red-600"
                : "text-gray-900"
            )}
          >
            {totalAmount.toLocaleString()}원
          </span>
        </div>
        {!canProceed && (
          <p className="text-xs text-red-500 mb-3">
            금액 합계가 0이어야 취소처리가 가능합니다
          </p>
        )}
        <button
          onClick={handleConfirm}
          disabled={!canProceed}
          className={cn(
            "w-full py-3 text-sm font-medium rounded-lg transition-colors",
            canProceed
              ? "text-white bg-red-600 hover:bg-red-700"
              : "text-gray-400 bg-gray-100 cursor-not-allowed"
          )}
        >
          취소처리
        </button>
      </div>
    </div>
  )
})
