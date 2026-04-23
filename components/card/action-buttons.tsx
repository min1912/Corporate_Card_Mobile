"use client"

import { memo, useState, useCallback } from "react"
import { MoreHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionButtonsProps {
  isEditable: boolean
  onSubmit: () => void
  onSaveDraft: () => void
  onPersonalUse: () => void
  onCancel: () => void
}

export const ActionButtons = memo(function ActionButtons({
  isEditable,
  onSubmit,
  onSaveDraft,
  onPersonalUse,
  onCancel,
}: ActionButtonsProps) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  const handleMoreClick = useCallback(() => {
    setMoreMenuOpen((prev) => !prev)
  }, [])

  const handlePersonalUse = useCallback(() => {
    setMoreMenuOpen(false)
    onPersonalUse()
  }, [onPersonalUse])

  const handleCancel = useCallback(() => {
    setMoreMenuOpen(false)
    onCancel()
  }, [onCancel])

  if (!isEditable) {
    return (
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
        <div className="max-w-[360px] mx-auto">
          <p className="text-center text-sm text-gray-500">
            수정할 수 없는 상태입니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* More Menu Overlay */}
      {moreMenuOpen && (
        <div
          className="absolute inset-0 bg-black/20 z-40"
          onClick={() => setMoreMenuOpen(false)}
        />
      )}

      {/* More Menu */}
      {moreMenuOpen && (
        <div className="absolute bottom-20 left-4 right-4 z-50 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden md:right-auto md:left-1/2 md:-translate-x-1/2 md:max-w-[344px] md:w-full">
          <button
            onClick={handleCancel}
            className="w-full px-4 py-3 text-center text-sm text-red-600 hover:bg-red-50 transition-colors border-b border-gray-100"
          >
            취소처리
          </button>
          <button
            onClick={handlePersonalUse}
            className="w-full px-4 py-3 text-center text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            개인사용
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-30">
        <div className="max-w-[360px] mx-auto flex items-center gap-2">
          <button
            onClick={handleMoreClick}
            className={cn(
              "p-3 rounded-lg border transition-colors",
              moreMenuOpen
                ? "bg-gray-100 border-gray-300"
                : "bg-white border-gray-200 hover:border-gray-300"
            )}
            aria-label="더보기"
          >
            {moreMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <button
            onClick={onSaveDraft}
            className="flex-1 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            임시저장
          </button>
          <button
            onClick={onSubmit}
            className="flex-[2] py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            상신하기
          </button>
        </div>
      </div>
    </>
  )
})
