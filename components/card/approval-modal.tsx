"use client"

import { memo, useState, useMemo, useCallback } from "react"
import { ChevronLeft, Search, X, Plus, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import type { Approver } from "@/lib/types"
import { allUsers } from "@/lib/mock-data"

interface ApprovalModalProps {
  approvers: Approver[]
  onConfirm: (approvers: Approver[]) => void
  onClose: () => void
}

export const ApprovalModal = memo(function ApprovalModal({
  approvers,
  onConfirm,
  onClose,
}: ApprovalModalProps) {
  const [currentApprovers, setCurrentApprovers] = useState<Approver[]>(approvers)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchIndex, setSearchIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const debouncedQuery = useDebounce(searchQuery, 300)

  const filteredUsers = useMemo(() => {
    return allUsers.filter(
      (user) =>
        user.name.includes(debouncedQuery) ||
        user.position.includes(debouncedQuery)
    )
  }, [debouncedQuery])

  const handleSelectUser = useCallback(
    (user: Omit<Approver, "order">) => {
      if (searchIndex !== null) {
        setCurrentApprovers((prev) =>
          prev.map((a, i) =>
            i === searchIndex
              ? { ...user, order: a.order }
              : a
          )
        )
      } else {
        // 새 결재자 추가
        const newOrder = Math.max(...currentApprovers.map((a) => a.order)) + 1
        setCurrentApprovers((prev) => [...prev, { ...user, order: newOrder }])
      }
      setSearchOpen(false)
      setSearchIndex(null)
      setSearchQuery("")
    },
    [searchIndex, currentApprovers]
  )

  const handleRemoveApprover = useCallback((index: number) => {
    setCurrentApprovers((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleOpenSearch = useCallback((index: number | null) => {
    setSearchIndex(index)
    setSearchOpen(true)
  }, [])

  const handleConfirm = useCallback(() => {
    onConfirm(currentApprovers)
  }, [currentApprovers, onConfirm])

  if (searchOpen) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="flex items-center px-4 py-3">
            <button
              onClick={() => {
                setSearchOpen(false)
                setSearchQuery("")
              }}
              className="p-1 -ml-1"
              aria-label="뒤로가기"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="ml-2 text-lg font-semibold text-gray-900">
              결재자 검색
            </h1>
          </div>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="이름 또는 직책으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <User className="w-8 h-8 mb-2" />
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.position} | {user.type}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button onClick={onClose} className="p-1 -ml-1" aria-label="뒤로가기">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900">결재선</h1>
        </div>
      </div>

      {/* Approver List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {currentApprovers.map((approver, index) => (
            <div
              key={`${approver.id}-${index}`}
              className={cn(
                "px-4 py-3 flex items-center justify-between",
                index !== currentApprovers.length - 1 && "border-b border-gray-100"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {approver.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {approver.position} | {approver.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenSearch(index)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="변경"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                </button>
                {currentApprovers.length > 1 && (
                  <button
                    onClick={() => handleRemoveApprover(index)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    aria-label="삭제"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add Approver */}
          <button
            onClick={() => handleOpenSearch(null)}
            className="w-full px-4 py-3 flex items-center gap-3 text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
          >
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-blue-300 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">결재자 추가</span>
          </button>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="p-4 bg-white border-t border-gray-100">
        <button
          onClick={handleConfirm}
          className="w-full py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          확인 및 상신
        </button>
      </div>
    </div>
  )
})
