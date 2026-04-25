"use client"

import { memo, type MouseEvent } from "react"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CardTransaction, FormState } from "@/lib/types"
import { StatusBadge } from "./status-badge"
import { DetailForm } from "./detail-form"
import { DetailInfo } from "./detail-info"
import { ActionButtons } from "./action-buttons"

interface DetailScreenProps {
  selectedTransaction: CardTransaction
  form: FormState
  isEditable: boolean
  onBack: () => void
  onFormChange: (form: FormState) => void
  onWbsClick: (event: MouseEvent<HTMLButtonElement>) => void
  onAccountClick: (event: MouseEvent<HTMLButtonElement>) => void
  onCopy: (text: string) => void
  onSubmit: () => void
  onSaveDraft: () => void
  onPersonalUse: () => void
  onCancel: () => void
}

export const DetailScreen = memo(function DetailScreen({
  selectedTransaction,
  form,
  isEditable,
  onBack,
  onFormChange,
  onWbsClick,
  onAccountClick,
  onCopy,
  onSubmit,
  onSaveDraft,
  onPersonalUse,
  onCancel,
}: DetailScreenProps) {
  return (
    <div className="relative flex flex-col h-full bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button onClick={onBack} className="p-1 -ml-1" aria-label="뒤로가기">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900">상세내역</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {selectedTransaction.status === "반려" && selectedTransaction.rejectReason && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-700 mb-1">반려 사유</p>
            <p className="text-sm text-red-600">{selectedTransaction.rejectReason}</p>
          </div>
        )}

        <div className="m-4 p-4 bg-white rounded-xl shadow-sm">
          <div className="flex items-start justify-between mb-3 gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-gray-900 break-keep">{selectedTransaction.merchant}</h2>
              <p className="text-sm text-gray-500">{selectedTransaction.businessType}</p>
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={selectedTransaction.status} />
            </div>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-2xl font-bold truncate",
                  selectedTransaction.amount < 0 ? "text-red-600" : "text-gray-900"
                )}
              >
                {selectedTransaction.amount.toLocaleString()}원
              </p>
              {selectedTransaction.isCancelled && (
                <span className="inline-block mt-1 text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md font-medium">결제취소</span>
              )}
            </div>
            <p className="text-sm text-gray-500 flex-shrink-0">
              {selectedTransaction.date} {selectedTransaction.time}
            </p>
          </div>
        </div>

        <DetailForm
          form={form}
          isEditable={isEditable}
          requiresAttachment={selectedTransaction.requiresAttachment || false}
          onFormChange={onFormChange}
          onWbsClick={onWbsClick}
          onAccountClick={onAccountClick}
          onCopy={onCopy}
        />

        <DetailInfo
          transaction={selectedTransaction}
          supplyAmount={form.supplyAmount}
          vatAmount={form.vatAmount}
          isEditable={isEditable}
        onAmountsChange={(supply, vat) => onFormChange({ ...form, supplyAmount: supply, vatAmount: vat })}
          onCopy={onCopy}
        />
      </div>

      <ActionButtons
        isEditable={isEditable}
        onSubmit={onSubmit}
        onSaveDraft={onSaveDraft}
        onPersonalUse={onPersonalUse}
        onCancel={onCancel}
      />
    </div>
  )
})
