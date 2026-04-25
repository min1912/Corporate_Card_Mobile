"use client"

import { memo, useCallback, useMemo, useState, useEffect } from "react"
import { CreditCard } from "lucide-react"
import { TransactionItem } from "./transaction-item"
import { cn } from "@/lib/utils"
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
  const [keptItems, setKeptItems] = useState<CardTransaction[]>([])
  const [exitingIds, setExitingIds] = useState<string[]>([])
  const [prevTransactions, setPrevTransactions] = useState<CardTransaction[]>(transactions)

  useEffect(() => {
    const currentIds = new Set(transactions.map((t) => t.id))
    const removed = prevTransactions.filter((pt) => !currentIds.has(pt.id))

    if (removed.length > 0) {
      // 1. 화면 전환 중 아이템이 즉시 사라지지 않도록 DOM에 임시 보관
      setKeptItems((prev) => {
        const next = [...prev, ...removed]
        return Array.from(new Map(next.map((item) => [item.id, item])).values())
      })

      // 2. 상세화면이 완전히 닫히는 시간(300ms) 대기 후, 위로 접히는 애니메이션 시작
      setTimeout(() => {
        setExitingIds((prev) => {
          const next = new Set(prev)
          removed.forEach((r) => next.add(r.id))
          return Array.from(next)
        })

        // 3. 애니메이션이 완료되는 시간(300ms) 대기 후, DOM에서 최종 제거
        setTimeout(() => {
          setKeptItems((prev) => prev.filter((et) => !removed.some((r) => r.id === et.id)))
          setExitingIds((prev) => prev.filter((id) => !removed.some((r) => r.id === id)))
        }, 300)
      }, 300)
    }
    setPrevTransactions(transactions)
  }, [transactions, prevTransactions])

  const handleSelect = useCallback((id: string) => {
    onSelect(id)
  }, [onSelect])

  const handleClick = useCallback((transaction: CardTransaction) => {
    onClick(transaction)
  }, [onClick])

  const handleLongPress = useCallback((id: string) => {
    onLongPress(id)
  }, [onLongPress])

  const displayTransactions = useMemo(() => {
    const combined = [...keptItems, ...transactions]
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values())
    
    return unique.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.time.localeCompare(a.time)
    })
  }, [transactions, keptItems])

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, CardTransaction[]> = {}
    displayTransactions.forEach((t) => {
      const date = t.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(t)
    })
    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
  }, [displayTransactions])

  if (displayTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <CreditCard className="w-12 h-12 mb-2 stroke-1" />
        <p className="text-sm">조회된 내역이 없습니다</p>
      </div>
    )
  }

  return (
    <div className="pb-2">
      {groupedTransactions.map(([date, dailyTransactions]) => {
        // 해당 날짜의 모든 내역이 사라지는 중인지 확인
        const isAllExiting = dailyTransactions.length > 0 && dailyTransactions.every(t => exitingIds.includes(t.id))
        
        return (
          <div key={date}>
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isAllExiting ? "opacity-0" : "opacity-100"
              )}
              style={{ gridTemplateRows: isAllExiting ? "0fr" : "1fr" }}
            >
              {/* 평소엔 sticky가 작동하도록 overflow-hidden을 애니메이션 중에만 적용합니다 */}
              <div className={cn("min-h-0", isAllExiting ? "overflow-hidden" : "")}>
                <div className="sticky top-0 z-10 flex items-center px-4 py-2 bg-white/95 backdrop-blur-sm">
                  <span className="text-xs font-medium text-gray-500 mr-3">{date}</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                </div>
              </div>
            </div>
            <div className="bg-white flex flex-col">
              {dailyTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  isSelected={selectedItems.includes(transaction.id)}
                  isSelectionMode={isSelectionMode}
                  isExiting={exitingIds.includes(transaction.id)}
                  onSelect={handleSelect}
                  onClick={handleClick}
                  onLongPress={handleLongPress}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
})
