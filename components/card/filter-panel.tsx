"use client"

import { memo, useState, useCallback, useEffect, type MouseEvent } from "react"
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebouncedCallback } from "@/hooks/use-debounce"
import { statusOptions, usageTypeOptions, cardHolderOptions } from "@/lib/mock-data"
import type { FilterState } from "@/lib/types"

interface FilterPanelProps {
  filter: FilterState
  onFilterChange: (value: FilterState | ((prev: FilterState) => FilterState)) => void
  isFilterActive: boolean
  onSearchOpen: () => void
  onFilterOpen: () => void
  isSelectionMode?: boolean
}

export const FilterPanel = memo(function FilterPanel({
  filter,
  onFilterChange,
  isFilterActive,
  onSearchOpen,
  onFilterOpen,
  isSelectionMode = false,
}: FilterPanelProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">법인카드 내역</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onSearchOpen}
            disabled={isSelectionMode}
            className={cn(
              "p-2 rounded-full transition-colors",
              isSelectionMode
                ? "text-gray-300 cursor-not-allowed"
                : filter.searchQuery
                ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                : "text-gray-500 hover:bg-gray-100"
            )}
            aria-label="검색"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={onFilterOpen}
            disabled={isSelectionMode}
            className={cn(
              "p-2 rounded-full transition-colors flex items-center gap-1",
              isSelectionMode
                ? "text-gray-300 cursor-not-allowed"
                : isFilterActive
                ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                : "text-gray-500 hover:bg-gray-100"
            )}
            aria-label="필터"
          >
            <Filter className="w-5 h-5" />
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">조회:</span>
        <span className="text-sm font-medium text-gray-700">{filter.status}</span>
        {filter.cardHolder !== "전체" && (
          <span className="text-sm text-gray-400">| {filter.cardHolder}</span>
        )}
        {filter.usageType !== "전체" && (
          <span className="text-sm text-gray-400">| {filter.usageType}</span>
        )}
      </div>
    </div>
  )
})

// Search Modal Component
interface SearchModalProps {
  filter: FilterState
  onFilterChange: (value: FilterState | ((prev: FilterState) => FilterState)) => void
  onClose: () => void
}

export const SearchModal = memo(function SearchModal({
  filter,
  onFilterChange,
  onClose,
}: SearchModalProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(filter.searchQuery)
  const [isVisible, setIsVisible] = useState(false)

  const debouncedSearchUpdate = useDebouncedCallback(
    (value: string) => {
      onFilterChange((prev) => ({ ...prev, searchQuery: value }))
    },
    300
  )

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
    if (filter.searchQuery !== localSearchQuery) {
      setLocalSearchQuery(filter.searchQuery)
    }
  }, [filter.searchQuery])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 200) // 애니메이션 시간(200ms) 이후 완전히 언마운트
  }, [onClose])

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearchQuery(value)
      debouncedSearchUpdate(value)
    },
    [debouncedSearchUpdate]
  )

  const handleClear = useCallback(() => {
    setLocalSearchQuery("")
    onFilterChange((prev) => ({ ...prev, searchQuery: "" }))
  }, [onFilterChange])

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 z-40 bg-black/20 transition-opacity duration-200 ease-in-out",
          isVisible ? "opacity-100" : "opacity-0"
        )} 
        onClick={handleClose} 
      />

      {/* Modal */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 transition-all duration-200 ease-in-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}>
        <div className="flex items-center px-4 py-3">
          <button onClick={handleClose} className="p-1 -ml-1" aria-label="뒤로가기">
            <X className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900">검색</h1>
        </div>
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="금액, 사용처, 계정명, 업종명, 승인번호 검색"
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            {localSearchQuery && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                aria-label="검색어 지우기"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
})

// Filter Bottom Sheet Component
interface FilterBottomSheetProps {
  filter: FilterState
  onFilterChange: (value: FilterState | ((prev: FilterState) => FilterState)) => void
  onClose: () => void
  onAccountSelect: (event: MouseEvent<HTMLButtonElement>) => void
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const getDefaultFilterDates = () => {
  const today = new Date()
  const lastMonthFirst = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  return {
    dateFrom: formatDate(lastMonthFirst),
    dateTo: formatDate(today),
  }
}

export const FilterBottomSheet = memo(function FilterBottomSheet({
  filter,
  onFilterChange,
  onClose,
  onAccountSelect,
}: FilterBottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 300) // 바텀 시트 애니메이션 시간(300ms) 대기
  }, [onClose])

  const handleFilterReset = useCallback(() => {
    const defaultDates = getDefaultFilterDates()
    onFilterChange(() => ({
      status: "미처리",
      usageType: "전체",
      cardHolder: "전체",
      dateFrom: defaultDates.dateFrom,
      dateTo: defaultDates.dateTo,
      accountName: "",
      searchQuery: "",
    }))
  }, [onFilterChange])

  const updateFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      onFilterChange({ ...filter, [key]: value })
    },
    [filter, onFilterChange]
  )

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 z-40 bg-black/20 transition-opacity duration-300 ease-in-out",
          isVisible ? "opacity-100" : "opacity-0"
        )} 
        onClick={handleClose} 
      />

      {/* Bottom Sheet */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-lg max-h-[80vh] overflow-y-auto transition-transform duration-300 ease-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="sticky top-0 bg-white border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900">필터</h1>
            <button onClick={handleClose} className="p-1" aria-label="닫기">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">시작일</label>
              <input
                type="date"
                value={filter.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">종료일</label>
              <input
                type="date"
                value={filter.dateTo}
                onChange={(e) => updateFilter("dateTo", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">진행상태</label>
            <select
              value={filter.status}
              onChange={(e) => updateFilter("status", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">국/내외</label>
              <select
                value={filter.usageType}
                onChange={(e) => updateFilter("usageType", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {usageTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">사용카드</label>
              <select
                value={filter.cardHolder}
                onChange={(e) => updateFilter("cardHolder", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {cardHolderOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">계정명</label>
            <button
              onClick={(event) => onAccountSelect(event)}
              className="w-full px-3 py-2 text-sm text-left border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors"
            >
              {filter.accountName || "계정 선택"}
            </button>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleFilterReset}
              className="flex-1 py-3 text-sm text-gray-600 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
            <button
            onClick={handleClose}
              className="flex-1 py-3 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </>
  )
})
