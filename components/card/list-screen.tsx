"use client"

import { memo, useState, useCallback, useRef, useEffect, type MouseEvent } from "react"
import { MoreHorizontal, X, RefreshCw, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CardTransaction, FilterState } from "@/lib/types"
import { FilterPanel, SearchModal, FilterBottomSheet } from "./filter-panel"
import { TransactionList } from "./transaction-list"
import { wbsOptions } from "@/lib/mock-data"

const BudgetBottomSheet = memo(function BudgetBottomSheet({ onClose }: { onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedWbs, setSelectedWbs] = useState(wbsOptions[0]?.code || "")

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const targetAccounts = ["회의비", "복리후생비-업무추진식대", "시내교통비"]

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 z-40 bg-black/20 transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-lg transition-transform duration-300 ease-out flex flex-col max-h-[85vh]",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">WBS 예산 조회</h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          <div className="mb-5">
            <label className="text-xs text-gray-500 mb-1.5 block">WBS 프로젝트 선택</label>
            <div className="relative">
              <select
                value={selectedWbs}
                onChange={(e) => setSelectedWbs(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium text-gray-900"
              >
                {wbsOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    [{opt.code}] {opt.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3">
            {targetAccounts.map((account) => {
              const hash = (selectedWbs + account).split("").reduce((a, b) => a + b.charCodeAt(0), 0)
              const total = ((hash % 10) + 3) * 1000000
              const used = ((hash % 7) + 1) * 350000
              const remaining = total - used
              const percent = Math.min(100, Math.round((used / total) * 100))

              return (
                <div key={account} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-gray-900">{account}</span>
                    <span className="text-xs font-medium px-2 py-1 bg-white rounded-md border border-gray-200 text-gray-600 shadow-sm">
                      잔여 {remaining.toLocaleString()}원
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                    <span>사용 {used.toLocaleString()}</span>
                    <span>총 {total.toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
})

type FilterChangeUpdater = FilterState | ((prev: FilterState) => FilterState)

interface ListScreenProps {
  filter: FilterState
  onFilterChange: (value: FilterChangeUpdater) => void
  isFilterActive: boolean
  filteredTransactions: CardTransaction[]
  selectedItems: string[]
  isSelectionMode: boolean
  onSelect: (id: string) => void
  onClick: (transaction: CardTransaction) => void
  onLongPress: (id: string) => void
  onCancelSelection: () => void
  onBatchCancel: () => void
  onBatchEdit?: () => void
  onBatchSubmit?: () => void
  onBatchPersonalUse?: () => void
  onFilterAccountSelect: (event: MouseEvent<HTMLButtonElement>) => void
  onSelectAll: () => void
}

export const ListScreen = memo(function ListScreen({
  filter,
  onFilterChange,
  isFilterActive,
  filteredTransactions,
  selectedItems,
  isSelectionMode,
  onSelect,
  onClick,
  onLongPress,
  onCancelSelection,
  onBatchCancel,
  onBatchEdit,
  onBatchSubmit,
  onBatchPersonalUse,
  onFilterAccountSelect,
  onSelectAll,
}: ListScreenProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isBudgetOpen, setIsBudgetOpen] = useState(false)

  // Pull-to-refresh states
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [startY, setStartY] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pullThreshold = 80

  const handleMoreClick = useCallback(() => {
    setIsMoreOpen((prev) => !prev)
  }, [])

  const handleMoreClose = useCallback(() => {
    setIsMoreOpen(false)
  }, [])

  const handleSearchOpen = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  const handleFilterOpen = useCallback(() => {
    setIsFilterOpen(true)
  }, [])

  const handleFilterClose = useCallback(() => {
    setIsFilterOpen(false)
  }, [])

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY)
      setIsPulling(true)
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || !startY || !scrollRef.current) return

    const currentY = e.touches[0].clientY
    const deltaY = currentY - startY

    if (deltaY > 0) {
      e.preventDefault()
      const distance = Math.min(deltaY * 0.5, 120) // Elastic effect
      setPullDistance(distance)
    }
  }, [isPulling, startY])

  const handleTouchEnd = useCallback(() => {
    if (!isPulling) return

    if (pullDistance >= pullThreshold) {
      setIsRefreshing(true)
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false)
        setPullDistance(0)
        setIsPulling(false)
        setStartY(null)
      }, 1500)
    } else {
      setPullDistance(0)
      setIsPulling(false)
      setStartY(null)
    }
  }, [isPulling, pullDistance, pullThreshold])

  // Calculate pull progress for indicator
  const pullProgress = Math.min(pullDistance / pullThreshold, 1)
  const indicatorOpacity = pullProgress * 0.8
  const indicatorScale = 0.8 + pullProgress * 0.2

  return (
    <div className="relative flex flex-col h-full bg-white">
      <FilterPanel
        filter={filter}
        onFilterChange={onFilterChange}
        isFilterActive={isFilterActive}
        onSearchOpen={handleSearchOpen}
        onFilterOpen={handleFilterOpen}
        isSelectionMode={isSelectionMode}
        selectedCount={selectedItems.length}
        totalCount={filteredTransactions.length}
        onSelectAll={onSelectAll}
        onCancelSelection={onCancelSelection}
        onBudgetOpen={() => setIsBudgetOpen(true)}
      />

      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center py-4 bg-white border-b border-gray-100"
          style={{
            transform: `translateY(${pullDistance - 60}px)`,
            transition: isPulling ? 'none' : 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: indicatorOpacity,
          }}
        >
          <div
            className="flex items-center gap-2 text-gray-500"
            style={{ transform: `scale(${indicatorScale})` }}
          >
            <RefreshCw
              className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`}
              style={{
                transform: `rotate(${pullProgress * 180}deg)`,
                transition: isPulling ? 'none' : 'transform 300ms ease-out',
              }}
            />
            <span className="text-sm">
              {isRefreshing ? '새로고침 중...' : pullDistance >= pullThreshold ? '놓아서 새로고침' : '아래로 당겨서 새로고침'}
            </span>
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pb-24 bounce-scroll"
        style={{
          overscrollBehavior: 'contain',
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <TransactionList
          transactions={filteredTransactions}
          selectedItems={selectedItems}
          isSelectionMode={isSelectionMode}
          onSelect={onSelect}
          onClick={onClick}
          onLongPress={onLongPress}
        />
      </div>

      {isSelectionMode && selectedItems.length > 0 && (
        <>
          {isMoreOpen && (
            <div className="absolute inset-0 z-40 bg-black/20" onClick={handleMoreClose} />
          )}
          {isMoreOpen && (
            <div className="absolute bottom-20 left-0 right-0 z-50 mx-auto max-w-[340px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <button
                onClick={() => {
                  onBatchCancel()
                  handleMoreClose()
                }}
                className="w-full px-4 py-3 text-center text-sm text-red-600 hover:bg-red-50 transition-colors border-b border-gray-100"
              >
                취소처리
              </button>
              {onBatchPersonalUse && (
                <button
                  onClick={() => {
                    onBatchPersonalUse()
                    handleMoreClose()
                  }}
                  className="w-full px-4 py-3 text-center text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  개인사용
                </button>
              )}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-30">
            <div className="max-w-[360px] mx-auto flex items-center gap-2">
              <button
                onClick={handleMoreClick}
                className={isMoreOpen ? "p-3 rounded-lg bg-gray-100 border border-gray-300" : "p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300"}
                aria-label="더보기"
              >
                {isMoreOpen ? <X className="w-5 h-5 text-gray-600" /> : <MoreHorizontal className="w-5 h-5 text-gray-600" />}
              </button>
              <button
                onClick={onBatchEdit}
                className="flex-1 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                일괄입력
              </button>
              <button
                onClick={onBatchSubmit}
                className="flex-[2] py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                상신
              </button>
            </div>
          </div>
        </>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <SearchModal
          filter={filter}
          onFilterChange={onFilterChange}
          onClose={handleSearchClose}
        />
      )}

      {/* Filter Bottom Sheet */}
      {isFilterOpen && (
        <FilterBottomSheet
          filter={filter}
          onFilterChange={onFilterChange}
          onClose={handleFilterClose}
          onAccountSelect={onFilterAccountSelect}
        />
      )}

      {/* Budget Bottom Sheet */}
      {isBudgetOpen && (
        <BudgetBottomSheet onClose={() => setIsBudgetOpen(false)} />
      )}
    </div>
  )
})
