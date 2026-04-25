"use client"

import { memo, useState, useCallback, useEffect, type ChangeEvent } from "react"
import { Copy, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CardTransaction } from "@/lib/types"

interface DetailInfoProps {
  transaction: CardTransaction
  supplyAmount: number
  vatAmount: number
  isEditable: boolean
  onAmountsChange: (supply: number, vat: number) => void
  onCopy: (text: string) => void
}

interface InfoRowProps {
  label: string
  value: string
  copyable?: boolean
  searchable?: boolean
  editable?: boolean
  editValue?: string
  onEditChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onEditBlur?: () => void
  bold?: boolean
  isEditable: boolean
  onCopy?: (text: string) => void
}

const InfoRow = memo(function InfoRow({
  label,
  value,
  copyable,
  searchable,
  editable,
  editValue,
  onEditChange,
  onEditBlur,
  bold,
  isEditable,
  onCopy,
}: InfoRowProps) {
  return (
    <div className="flex justify-between py-2 items-center gap-3">
      <span className="text-gray-500 text-sm flex-shrink-0 whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
        {editable && isEditable ? (
          <input
            type="text"
            value={editValue}
            onChange={onEditChange}
            onBlur={onEditBlur}
            className="w-28 text-right px-2 py-1 border rounded text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <span className={cn("text-gray-900 text-sm text-right break-keep", bold && "font-semibold")}>
            {value}
          </span>
        )}
        {copyable && (
          <button
            onClick={() => onCopy?.(value)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            aria-label="복사"
          >
            <Copy className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
        {searchable && (
          <button className="p-1 rounded hover:bg-gray-100 transition-colors" aria-label="검색">
            <Search className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )
})

export const DetailInfo = memo(function DetailInfo({
  transaction,
  supplyAmount,
  vatAmount,
  isEditable,
  onAmountsChange,
  onCopy,
}: DetailInfoProps) {
  const [localSupply, setLocalSupply] = useState(supplyAmount.toLocaleString())
  const [localVat, setLocalVat] = useState(vatAmount.toLocaleString())
  const [localActualUser, setLocalActualUser] = useState("김한화")

  useEffect(() => {
    setLocalSupply(supplyAmount.toLocaleString())
    setLocalVat(vatAmount.toLocaleString())
  }, [supplyAmount, vatAmount])

  const handleSupplyBlur = useCallback(() => {
    let parsedSupply = parseInt(localSupply.replace(/,/g, ""), 10) || 0
    // 승인금액이 마이너스인 경우, 입력값이 양수이면 자동으로 마이너스 변환
    if (transaction.amount < 0 && parsedSupply > 0) {
      parsedSupply = -parsedSupply
    }
    
    const calculatedVat = transaction.amount - parsedSupply

    setLocalSupply(parsedSupply.toLocaleString())
    setLocalVat(calculatedVat.toLocaleString())

    if (parsedSupply !== supplyAmount || calculatedVat !== vatAmount) {
      onAmountsChange(parsedSupply, calculatedVat)
    }
  }, [localSupply, supplyAmount, vatAmount, transaction.amount, onAmountsChange])

  const handleVatBlur = useCallback(() => {
    let parsedVat = parseInt(localVat.replace(/,/g, ""), 10) || 0
    // 승인금액이 마이너스인 경우, 입력값이 양수이면 자동으로 마이너스 변환
    if (transaction.amount < 0 && parsedVat > 0) {
      parsedVat = -parsedVat
    }
    
    const calculatedSupply = transaction.amount - parsedVat

    setLocalVat(parsedVat.toLocaleString())
    setLocalSupply(calculatedSupply.toLocaleString())

    if (calculatedSupply !== supplyAmount || parsedVat !== vatAmount) {
      onAmountsChange(calculatedSupply, parsedVat)
    }
  }, [localVat, supplyAmount, vatAmount, transaction.amount, onAmountsChange])

  const handleSupplyChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/,/g, "")
    if (val === "" || val === "-") setLocalSupply(val)
    else if (!isNaN(Number(val))) setLocalSupply(Number(val).toLocaleString())
  }, [])

  const handleVatChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/,/g, "")
    if (val === "" || val === "-") setLocalVat(val)
    else if (!isNaN(Number(val))) setLocalVat(Number(val).toLocaleString())
  }, [])

  return (
    <div className="mx-4 mb-4 p-4 bg-white rounded-xl shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">상세 정보</h3>
      <div className="divide-y divide-gray-50">
        <InfoRow isEditable={isEditable} label="사용처" value={transaction.merchant} />
        <InfoRow
          isEditable={isEditable}
          label="사용일시"
          value={`${transaction.date} ${transaction.time}`}
        />
        <InfoRow isEditable={isEditable} label="업종명" value={transaction.businessType} />
        <InfoRow
          isEditable={isEditable}
          label="카드번호"
          value={`**** **** **** ${transaction.cardNumber}`}
        />
        <InfoRow
          isEditable={isEditable}
          label="승인금액"
          value={`${transaction.amount.toLocaleString()}원`}
          bold
        />
        <InfoRow
          isEditable={isEditable}
          label="승인/취소"
          value={transaction.isCancelled ? "취소" : "승인"}
        />
        <InfoRow
          label="실사용자"
          value={localActualUser}
          editable
          isEditable={isEditable}
          editValue={localActualUser}
          onEditChange={(e) => setLocalActualUser(e.target.value)}
        />
        <InfoRow
          label="공급가액"
          value={localSupply}
          editable
          isEditable={isEditable}
          editValue={localSupply}
          onEditChange={handleSupplyChange}
          onEditBlur={handleSupplyBlur}
        />
        <InfoRow
          label="부가세액"
          value={localVat}
          editable
          isEditable={isEditable}
          editValue={localVat}
          onEditChange={handleVatChange}
          onEditBlur={handleVatBlur}
        />
        <InfoRow
          isEditable={isEditable}
          label="승인번호"
          value={transaction.approvalNumber}
          copyable
          onCopy={onCopy}
        />
        <InfoRow isEditable={isEditable} label="전기일" value={transaction.postingDate} />
      </div>
    </div>
  )
})
