"use client"

import { memo, useState } from "react"
import { X, MoreVertical, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectionHeaderProps {
  selectedCount: number
  onCancel: () => void
  onBatchCancel: () => void
  onBatchSubmit?: () => void
  onBatchPersonalUse?: () => void
}

export const SelectionHeader = memo(function SelectionHeader({
  selectedCount,
  onCancel,
  onBatchCancel,
  onBatchSubmit,
  onBatchPersonalUse,
}: SelectionHeaderProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  return (
    <div className="sticky top-0 z-20 bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-blue-100 transition-colors"
          aria-label="선택 취소"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <span className="text-sm font-medium text-blue-700">
          {selectedCount}건 선택
        </span>
      </div>
      <div className="flex items-center gap-2">
        {/* 상신 버튼 */}
        {onBatchSubmit && (
          <button
            onClick={onBatchSubmit}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            상신
          </button>
        )}
        
        {/* 더보기 버튼 */}
        <div className="relative">
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="p-1.5 text-sm font-medium text-gray-600 hover:bg-blue-100 rounded-lg transition-colors"
            aria-label="더보기"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {isMoreMenuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
              {onBatchCancel && (
                <button
                  onClick={() => {
                    onBatchCancel()
                    setIsMoreMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors first:rounded-t-lg"
                >
                  취소처리
                </button>
              )}
              {onBatchPersonalUse && (
                <button
                  onClick={() => {
                    onBatchPersonalUse()
                    setIsMoreMenuOpen(false)
                  }}
                  className="w-full px-4 py-2 text-sm text-left text-gray-600 hover:bg-gray-50 transition-colors last:rounded-b-lg"
                >
                  개인사용
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
