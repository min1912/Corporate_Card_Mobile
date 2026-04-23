"use client"

import { memo, useCallback } from "react"
import { CreditCard } from "lucide-react"
import { TransactionItem } from "./transaction-item"
import type { CardTransaction } from "@/lib/types"

interface TransactionListProps {
  transactions: CardTransaction[]
  selectedItems: string[]
  isSelectionMode: boolean
  onSelect: (id: string) => void
  onClick: (transaction: CardTransaction) => void
  onLongPress: (id: string) => void
}

export const TransactionList = memo(function TransactionList({
  transactions,
  selectedItems,
  isSelectionMode,
  onSelect,
  onClick,
  onLongPress,
}: TransactionListProps) {
  const handleSelect = useCallback((id: string) => {
    onSelect(id)
  }, [onSelect])

  const handleClick = useCallback((transaction: CardTransaction) => {
    onClick(transaction)
  }, [onClick])

  const handleLongPress = useCallback((id: string) => {
    onLongPress(id)
  }, [onLongPress])

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <CreditCard className="w-12 h-12 mb-2 stroke-1" />
        <p className="text-sm">조회된 내역이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {transactions.map((transaction) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          isSelected={selectedItems.includes(transaction.id)}
          isSelectionMode={isSelectionMode}
          onSelect={handleSelect}
          onClick={handleClick}
          onLongPress={handleLongPress}
        />
      ))}
    </div>
  )
})
