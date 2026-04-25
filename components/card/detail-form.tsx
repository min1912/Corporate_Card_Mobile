"use client"

import { memo, useState, useCallback, useEffect, type MouseEvent } from "react"
import { Copy, ChevronDown, Paperclip, X, FileText, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FormState, AttachmentFile, AccountOption } from "@/lib/types"
import { accountOptions } from "@/lib/mock-data"

interface DetailFormProps {
  form: FormState
  isEditable: boolean
  requiresAttachment: boolean
  onFormChange: (form: FormState) => void
  onWbsClick: (event: MouseEvent<HTMLButtonElement>) => void
  onAccountClick: (event: MouseEvent<HTMLButtonElement>) => void
  onCopy: (text: string) => void
}

export const DetailForm = memo(function DetailForm({
  form,
  isEditable,
  requiresAttachment,
  onFormChange,
  onWbsClick,
  onAccountClick,
  onCopy,
}: DetailFormProps) {
  const [localUsageDescription, setLocalUsageDescription] = useState(form.usageDescription)
  const [localVehicleNumber, setLocalVehicleNumber] = useState(form.vehicleNumber)

  // form이 변경되면 로컬 상태도 동기화
  useEffect(() => {
    setLocalUsageDescription(form.usageDescription)
    setLocalVehicleNumber(form.vehicleNumber)
  }, [form.usageDescription, form.vehicleNumber])

  const updateForm = useCallback(
    (key: keyof FormState, value: unknown) => {
      onFormChange({ ...form, [key]: value })
    },
    [form, onFormChange]
  )

  const handleUsageDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      setLocalUsageDescription(value)
    },
    []
  )

  const handleUsageDescriptionBlur = useCallback(() => {
    if (localUsageDescription !== form.usageDescription) {
      updateForm("usageDescription", localUsageDescription)
    }
  }, [localUsageDescription, form.usageDescription, updateForm])

  const handleVehicleNumberBlur = useCallback(() => {
    if (localVehicleNumber !== form.vehicleNumber) {
      updateForm("vehicleNumber", localVehicleNumber)
    }
  }, [localVehicleNumber, form.vehicleNumber, updateForm])

  const handleAddAttachment = useCallback(() => {
    const newFile: AttachmentFile = {
      id: Date.now().toString(),
      name: `첨부파일${form.attachments.length + 1}.pdf`,
      size: Math.floor(Math.random() * 1000000),
      type: "application/pdf",
    }
    updateForm("attachments", [...form.attachments, newFile])
  }, [form.attachments, updateForm])

  const handleRemoveAttachment = useCallback(
    (id: string) => {
      updateForm(
        "attachments",
        form.attachments.filter((a) => a.id !== id)
      )
    },
    [form.attachments, updateForm]
  )

  // 선택된 계정이 차량유지비인지 확인
  const selectedAccount = accountOptions.find((a) => a.code === form.accountCode)
  const showVehicleFields = selectedAccount?.hasExtraFields

  const isAttachmentRequired = requiresAttachment && form.attachments.length === 0

  return (
    <div className="mx-4 mb-4 p-4 bg-white rounded-xl shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">입력 정보</h3>

      {/* WBS Code */}
      <div>
        <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
          WBS코드 <span className="text-red-500">*</span>
        </label>
        <button
          onClick={(event) => onWbsClick(event)}
          disabled={!isEditable}
          className={cn(
            "w-full px-3 py-2.5 text-left border rounded-lg flex items-center justify-between transition-colors",
            isEditable
              ? "border-gray-200 bg-white hover:border-gray-300"
              : "border-gray-100 bg-gray-50 cursor-not-allowed",
            !form.wbsCode && isEditable && "border-amber-300"
          )}
        >
          <span className={form.wbsCode ? "text-gray-900" : "text-gray-400"}>
            {form.wbsCode ? `${form.wbsCode}   ${form.wbsName}` : "WBS코드 선택"}
          </span>
          {isEditable && <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* Account */}
      <div>
        <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
          계정 <span className="text-red-500">*</span>
        </label>
        <button
          onClick={(event) => onAccountClick(event)}
          disabled={!isEditable}
          className={cn(
            "w-full px-3 py-2.5 text-left border rounded-lg flex items-center justify-between transition-colors",
            isEditable
              ? "border-gray-200 bg-white hover:border-gray-300"
              : "border-gray-100 bg-gray-50 cursor-not-allowed",
            !form.accountCode && isEditable && "border-amber-300"
          )}
        >
          <span className={form.accountCode ? "text-gray-900" : "text-gray-400"}>
            {form.accountCode
              ? `${form.accountCode} ${form.accountName}`
              : "계정 선택"}
          </span>
          {isEditable && <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* Usage Description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-500 flex items-center gap-1">
            사용내역 <span className="text-red-500">*</span>
          </label>
          {localUsageDescription && (
            <button
              onClick={() => onCopy(localUsageDescription)}
              className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-700"
            >
              <Copy className="w-3 h-3" /> 복사
            </button>
          )}
        </div>
        <textarea
          value={localUsageDescription}
          onChange={handleUsageDescriptionChange}
          onBlur={handleUsageDescriptionBlur}
          disabled={!isEditable}
          placeholder="사용 내역을 입력하세요"
          className={cn(
            "w-full px-3 py-2.5 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
            isEditable
              ? "border-gray-200 bg-white"
              : "border-gray-100 bg-gray-50 cursor-not-allowed",
            !localUsageDescription && isEditable && "border-amber-300"
          )}
          rows={2}
        />
      </div>

      {/* File Attachment */}
      <div>
        <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
          파일첨부
          {requiresAttachment && (
            <>
              <span className="text-red-500">*</span>
              <span className="text-red-500 text-xs">(필수)</span>
            </>
          )}
        </label>
        {isAttachmentRequired && (
          <div className="flex items-center gap-1 text-red-500 text-xs mb-2">
            <AlertCircle className="w-3 h-3" />
            <span>증빙서류 첨부가 필요합니다</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {form.attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 rounded text-xs"
            >
              <FileText className="w-3 h-3 text-gray-500" />
              <span className="max-w-[120px] truncate">{file.name}</span>
              {isEditable && (
                <button
                  onClick={() => handleRemoveAttachment(file.id)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          ))}
          {isEditable && (
            <button
              onClick={handleAddAttachment}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 border border-dashed rounded text-xs transition-colors",
                isAttachmentRequired
                  ? "border-red-300 text-red-500 hover:border-red-400"
                  : "border-gray-300 text-gray-500 hover:border-gray-400"
              )}
            >
              <Paperclip className="w-3 h-3" />
              <span>첨부</span>
            </button>
          )}
        </div>
      </div>

      {/* Additional Info for Vehicle */}
      {showVehicleFields && (
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1">
            보조정보
            <span className="text-red-500">*</span>
          </h4>
          <div>
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              유류비 여부 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => isEditable && updateForm("fuelType", "Y")}
                disabled={!isEditable}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                  form.fuelType === "Y"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                )}
              >
                예
              </button>
              <button
                onClick={() => isEditable && updateForm("fuelType", "N")}
                disabled={!isEditable}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                  form.fuelType === "N"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                )}
              >
                아니오
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              차량번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={localVehicleNumber}
              onChange={(e) => setLocalVehicleNumber(e.target.value)}
              onBlur={handleVehicleNumberBlur}
              disabled={!isEditable}
              placeholder="예: 12가 3456"
              className={cn(
                "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors",
                isEditable
                  ? "border-gray-200 bg-white"
                  : "border-gray-100 bg-gray-50 cursor-not-allowed"
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
})
