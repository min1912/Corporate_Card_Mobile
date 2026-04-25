"use client"

import { memo, type MouseEvent } from "react"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CardTransaction, FormState } from "@/lib/types"
import { DetailForm } from "./detail-form"
import { ActionButtons } from "./action-buttons"

interface BatchEditScreenProps {
  selectedTransactions: CardTransaction[]
  form: FormState
  isEditable: boolean
  onBack: () => void
  onFormChange: (form: FormState) => void
  onWbsClick: (event: MouseEvent<HTMLButtonElement>) => void
  onAccountClick: (event: MouseEvent<HTMLButtonElement>) => void
  onCopy: (text: string) => void
  onSaveDraft: () => void
  onSubmit: () => void
  onPersonalUse: () => void
  onCancel: () => void
}

export const BatchEditScreen = memo(function BatchEditScreen({
  selectedTransactions,
  form,
  isEditable,
  onBack,
  onFormChange,
  onWbsClick,
  onAccountClick,
  onCopy,
  onSaveDraft,
  onSubmit,
  onPersonalUse,
  onCancel,
}: BatchEditScreenProps) {
  return (
    <div className="relative flex flex-col h-full bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button onClick={onBack} className="p-1 -ml-1" aria-label="뒤로가기">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900">일괄입력</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 pt-4">
        <DetailForm
          form={form}
          isEditable={isEditable}
          requiresAttachment={false}
          onFormChange={onFormChange}
          onWbsClick={onWbsClick}
          onAccountClick={onAccountClick}
          onCopy={onCopy}
        />

        <div className="mx-4 mb-4 p-4 bg-white rounded-xl shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">선택된 거래</h2>
          <div className="flex flex-col gap-3">
            {selectedTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-start justify-between gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 line-clamp-2 break-keep mb-0.5">{transaction.merchant}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="whitespace-nowrap">{transaction.date} {transaction.time}</span>
                    <span className="mx-1.5 text-gray-300">|</span>
                    <span className="truncate">{transaction.businessType}</span>
                  </div>
                </div>
                <p className={cn(
                  "text-sm font-bold flex-shrink-0 whitespace-nowrap",
                  transaction.amount < 0 ? "text-red-600" : "text-gray-900"
                )}>
                  {transaction.amount.toLocaleString()}원
                </p>
              </div>
            ))}
          </div>
        </div>
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
