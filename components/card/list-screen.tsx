"use client"

import { memo, useState, useCallback, useRef, useEffect, type MouseEvent } from "react"
import { MoreHorizontal, X, RefreshCw } from "lucide-react"
import type { CardTransaction, FilterState } from "@/lib/types"
import { FilterPanel, SearchModal, FilterBottomSheet } from "./filter-panel"
import { TransactionList } from "./transaction-list"

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
}: ListScreenProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

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
                일괄수정
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
    </div>
  )
})
