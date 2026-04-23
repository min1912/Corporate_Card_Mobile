"use client"

import { memo, useState, useCallback, useEffect } from "react"
import { Copy, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CardTransaction } from "@/lib/types"

interface DetailInfoProps {
  transaction: CardTransaction
  supplyAmount: number
  vatAmount: number
  isEditable: boolean
  onSupplyAmountChange: (value: number) => void
  onVatAmountChange: (value: number) => void
  onCopy: (text: string) => void
}

export const DetailInfo = memo(function DetailInfo({
  transaction,
  supplyAmount,
  vatAmount,
  isEditable,
  onSupplyAmountChange,
  onVatAmountChange,
  onCopy,
}: DetailInfoProps) {
  const [localSupply, setLocalSupply] = useState(supplyAmount.toString())
  const [localVat, setLocalVat] = useState(vatAmount.toString())

  useEffect(() => {
    setLocalSupply(supplyAmount.toString())
    setLocalVat(vatAmount.toString())
  }, [supplyAmount, vatAmount])

  const handleSupplyBlur = useCallback(() => {
    const value = parseInt(localSupply) || 0
    if (value !== supplyAmount) {
      onSupplyAmountChange(value)
    }
  }, [localSupply, supplyAmount, onSupplyAmountChange])

  const handleVatBlur = useCallback(() => {
    const value = parseInt(localVat) || 0
    if (value !== vatAmount) {
      onVatAmountChange(value)
    }
  }, [localVat, vatAmount, onVatAmountChange])

  const InfoRow = ({
    label,
    value,
    copyable,
    searchable,
    editable,
    editValue,
    onEditChange,
    onEditBlur,
    bold,
  }: {
    label: string
    value: string
    copyable?: boolean
    searchable?: boolean
    editable?: boolean
    editValue?: string
    onEditChange?: (value: string) => void
    onEditBlur?: () => void
    bold?: boolean
  }) => (
    <div className="flex justify-between py-2 items-center">
      <span className="text-gray-500 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {editable ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditChange?.(e.target.value)}
            onBlur={onEditBlur}
            disabled={!isEditable}
            className={cn(
              "w-28 text-right px-2 py-1 border rounded text-sm",
              isEditable
                ? "border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                : "border-transparent bg-transparent"
            )}
          />
        ) : (
          <span
            className={cn("text-gray-900 text-sm", bold && "font-semibold")}
          >
            {value}
          </span>
        )}
        {copyable && (
          <button
            onClick={() => onCopy(value)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="복사"
          >
            <Copy className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
        {searchable && (
          <button
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="검색"
          >
            <Search className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="mx-4 mb-4 p-4 bg-white rounded-xl shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">상세 정보</h3>
      <div className="divide-y divide-gray-50">
        <InfoRow label="승인번호" value={transaction.approvalNumber} copyable />
        <InfoRow
          label="카드번호"
          value={`**** **** **** ${transaction.cardNumber}`}
        />
        <InfoRow
          label="사용일시"
          value={`${transaction.date} ${transaction.time}`}
        />
        <InfoRow label="사용처" value={transaction.merchant} />
        <InfoRow label="업종명" value={transaction.businessType} />
        <InfoRow label="전기일" value={transaction.postingDate} />
        <InfoRow
          label="승인금액"
          value={`${transaction.amount.toLocaleString()}원`}
          bold
        />
        <InfoRow
          label="공급가액"
          value=""
          editable
          editValue={localSupply}
          onEditChange={setLocalSupply}
          onEditBlur={handleSupplyBlur}
        />
        <InfoRow
          label="부가세액"
          value=""
          editable
          editValue={localVat}
          onEditChange={setLocalVat}
          onEditBlur={handleVatBlur}
        />
        <InfoRow
          label="승인/취소"
          value={transaction.isCancelled ? "취소" : "승인"}
        />
        <InfoRow
          label="관리번호"
          value={transaction.managementNumber}
          copyable
          searchable
        />
      </div>
    </div>
  )
})
