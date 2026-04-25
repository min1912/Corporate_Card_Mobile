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
          <h1 className="ml-2 text-lg font-semibold text-gray-900">일괄수정</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="mx-4 mt-4">
          <DetailForm
            form={form}
            isEditable={isEditable}
            requiresAttachment={false}
            onFormChange={onFormChange}
            onWbsClick={onWbsClick}
            onAccountClick={onAccountClick}
            onCopy={onCopy}
          />

          <div className="mt-4 p-4 bg-white rounded-xl shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">선택된 거래</h2>
            <div className="space-y-3">
              {selectedTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate">{transaction.merchant}</p>
                    <p className="text-xs text-gray-500">{transaction.businessType}</p>
                  </div>
                  <p className={cn(
                    "text-sm font-bold",
                    transaction.amount < 0 ? "text-red-600" : "text-gray-900"
                  )}>
                    {transaction.amount.toLocaleString()}원
                  </p>
                </div>
              ))}
            </div>
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
