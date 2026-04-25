"use client"

import { memo, useState, useMemo, useCallback, useEffect, useRef } from "react"
import { ChevronLeft, Search, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import type { WbsOption, AccountOption } from "@/lib/types"

interface SearchModalProps {
  type: "wbs" | "account"
  options: WbsOption[] | AccountOption[]
  originRect?: {
    left: number
    top: number
    width: number
    height: number
  } | null
  onSelect: (item: WbsOption | AccountOption) => void
  onClose: () => void
}

export const SearchModal = memo(function SearchModal({
  type,
  options,
  originRect = null,
  onSelect,
  onClose,
}: SearchModalProps) {
  const [localQuery, setLocalQuery] = useState("")
  const [expanded, setExpanded] = useState(false)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const debouncedQuery = useDebounce(localQuery, 300)

  // 즐겨찾기 상태 로컬 관리
  const [localFrequents, setLocalFrequents] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    if (type === "account") {
      options.forEach((o) => {
        if ("frequent" in o && o.frequent) initial.add(o.code)
      })
    }
    return initial
  })

  const toggleFrequent = useCallback((code: string, e: React.MouseEvent) => {
    e.stopPropagation() // 항목 전체 클릭 이벤트 방지
    setLocalFrequents((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)

      // 원본 옵션 데이터 업데이트 (모달을 닫았다 열어도 메모리 상에 유지되도록 처리)
      const targetOption = options.find((o) => o.code === code)
      if (targetOption && "frequent" in targetOption) {
        (targetOption as AccountOption).frequent = next.has(code)
      }

      return next
    })
  }, [options])

  useEffect(() => {
    requestAnimationFrame(() => setExpanded(true))
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleClose = useCallback(() => {
    setExpanded(false)
    timeoutRef.current = window.setTimeout(onClose, 150)
  }, [onClose])

  const handleSelect = useCallback(
    (item: WbsOption | AccountOption) => {
      setSelectedCode(item.code)
      setExpanded(false)
      timeoutRef.current = window.setTimeout(() => onSelect(item), 150)
    },
    [onSelect]
  )

  const filteredOptions = useMemo(() => {
    const query = debouncedQuery.toLowerCase()
    let filtered = options.filter(
      (opt) =>
        opt.code.toLowerCase().includes(query) ||
        opt.name.toLowerCase().includes(query)
    )

    if (type === "account") {
      filtered = [...filtered].sort((a, b) => {
        const aFreq = localFrequents.has(a.code) ? 1 : 0
        const bFreq = localFrequents.has(b.code) ? 1 : 0
        return bFreq - aFreq
      })
    }

    return filtered
  }, [options, debouncedQuery, type, localFrequents])

  const title = type === "wbs" ? "WBS코드 선택" : "계정 선택"
  const placeholder =
    type === "wbs" ? "WBS코드 또는 프로젝트명 검색" : "계정코드 또는 계정명 검색"

  const searchBoxStyle = {
    transform: expanded ? "translateY(0) scale(1)" : "translateY(16px) scale(0.95)",
    transformOrigin: "center",
    transition: "transform 150ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    opacity: expanded ? 1 : 0,
  } as const

  const resultsStyle = {
    opacity: expanded ? 1 : 0,
    transform: expanded ? "translateY(0)" : "translateY(12px)",
    transition: "opacity 120ms ease-out 80ms, transform 120ms ease-out 80ms",
  } as const

  return (
    <div className="absolute inset-0 z-50 overflow-hidden">
      <button
        className="absolute inset-0 bg-black/20"
        style={{ opacity: expanded ? 1 : 0, transition: "opacity 150ms ease-out" }}
        onClick={handleClose}
        aria-label="뒤로가기"
      />

      <div className="absolute inset-x-0 top-0 px-4 pt-4 h-full z-40 pointer-events-none">
        <div
          style={searchBoxStyle}
          className="mx-auto w-full max-w-[360px] rounded-[20px] bg-white shadow-xl ring-1 ring-black/5 overflow-hidden h-full flex flex-col pointer-events-auto"
        >
          <div className="flex items-center px-4 py-3">
            <button onClick={handleClose} className="p-1 -ml-1" aria-label="뒤로가기">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="ml-2 text-lg font-semibold text-gray-900">{title}</h1>
          </div>

          <div className="px-4 pb-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={placeholder}
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          <div style={resultsStyle} className="px-4 pb-8 pt-4 overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="rounded-[20px] bg-white shadow-sm p-4 text-center text-sm text-gray-500">
                <Search className="mx-auto mb-2 w-8 h-8 text-gray-400" />
                <p>검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredOptions.map((item) => {
                  const isAccount = type === "account"
                  const isFrequent = isAccount && localFrequents.has(item.code)
                  const isSelected = selectedCode === item.code

                  return (
                    <div
                      key={item.code}
                      onClick={() => handleSelect(item)}
                      className={cn(
                        "w-full rounded-2xl bg-white px-4 py-3 text-left transition-all duration-200 shadow-sm flex items-center gap-3 cursor-pointer select-none",
                        isSelected ? "scale-[0.98] bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                      )}
                      style={isSelected ? { transform: "scale(0.98)", opacity: 0.75 } : undefined}
                    >
                      {isAccount && (
                        <button
                          type="button"
                          onClick={(e) => toggleFrequent(item.code, e)}
                          className="p-1.5 -ml-1.5 flex-shrink-0 rounded-full hover:bg-gray-200 transition-colors"
                          aria-label={isFrequent ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                        >
                          <Star
                            className={cn(
                              "w-5 h-5 transition-colors",
                              isFrequent ? "text-amber-400 fill-amber-400" : "text-gray-300 hover:text-amber-300"
                            )}
                          />
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        {isAccount ? (
                          <>
                            <p className="text-base font-semibold text-gray-900 truncate mb-0.5">{item.name}</p>
                            <p className="text-xs text-gray-500 truncate">{item.code}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-gray-900 truncate mb-0.5">{item.code}</p>
                            <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
