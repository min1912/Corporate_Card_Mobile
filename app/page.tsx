"use client"

import { useState, useCallback, useMemo, useEffect, useRef, type PointerEvent } from "react"
import type { MouseEvent } from "react"

// Types
import type { CardTransaction, FilterState, FormState, Approver } from "@/lib/types"

// Mock Data
import {
  mockTransactions,
  wbsOptions,
  accountOptions,
  defaultApprovers,
} from "@/lib/mock-data"

// Components
import { DetailForm } from "@/components/card/detail-form"
import { DetailInfo } from "@/components/card/detail-info"
import { ActionButtons } from "@/components/card/action-buttons"
import { SearchModal } from "@/components/card/search-modal"
import { ApprovalModal } from "@/components/card/approval-modal"
import { CancelMatchModal } from "@/components/card/cancel-match-modal"
import { ToastNotification } from "@/components/card/toast-notification"
import { ListScreen } from "@/components/card/list-screen"
import { DetailScreen } from "@/components/card/detail-screen"
import { BatchEditScreen } from "@/components/card/batch-edit-screen"

type ViewType = "list" | "detail" | "batchEdit" | "wbs" | "account" | "approval" | "cancelMatch"

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const getDefaultFilterDates = () => {
  const today = new Date()
  const lastMonthFirst = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  return {
    dateFrom: formatDate(lastMonthFirst),
    dateTo: formatDate(today),
  }
}

const defaultFilterDates = getDefaultFilterDates()

const initialFilter: FilterState = {
  status: "미처리",
  usageType: "전체",
  cardHolder: "전체",
  dateFrom: defaultFilterDates.dateFrom,
  dateTo: defaultFilterDates.dateTo,
  accountName: "",
  searchQuery: "",
}

const initialForm: FormState = {
  wbsCode: "",
  wbsName: "",
  accountCode: "",
  accountName: "",
  usageDescription: "",
  supplyAmount: 0,
  vatAmount: 0,
  attachments: [],
  fuelType: "",
  vehicleNumber: "",
}

export default function CorporateCardMobile() {
  // View state
  const [view, setView] = useState<ViewType>("list")
  const [returnView, setReturnView] = useState<ViewType>("detail")
  const [approvalMode, setApprovalMode] = useState<"detail" | "batch" | null>(null)

  // Data state
  const [transactions, setTransactions] = useState<CardTransaction[]>(mockTransactions)
  const [selectedTransaction, setSelectedTransaction] = useState<CardTransaction | null>(null)

  // Selection state
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [accountSelectTarget, setAccountSelectTarget] = useState<"filter" | "form">("form")
  const [searchOrigin, setSearchOrigin] = useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)
  const [isPageLeaving, setIsPageLeaving] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const transitionTimeoutRef = useRef<number | null>(null)
  const prevViewRef = useRef<ViewType>("list")
  const [skipTransition, setSkipTransition] = useState(false)

  // Filter state
  const [filter, setFilter] = useState<FilterState>(initialFilter)

  // Form state
  const [form, setForm] = useState<FormState>(initialForm)

  // Approval state
  const [approvers, setApprovers] = useState<Approver[]>(defaultApprovers)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info"; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  })

  // Computed values
  const isFilterActive = useMemo(() => {
    return (
      filter.status !== "전체" ||
      filter.usageType !== "전체" ||
      filter.cardHolder !== "전체" ||
      filter.accountName !== ""
    )
  }, [filter])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Status filter
      if (filter.status !== "전체") {
          let statusMatch = false
          if (filter.status === "미처리") {
            statusMatch = ["미처리", "반려"].includes(t.status)
          } else if (filter.status === "진행 중") {
            statusMatch = ["진행 중-현업", "진행 중-회계"].includes(t.status)
          } else if (filter.status === "완료") {
            statusMatch = ["검토완료", "지급완료"].includes(t.status)
          } else {
            statusMatch = t.status === filter.status
          }
          if (!statusMatch) return false
      }

      // Usage type filter
      if (filter.usageType !== "전체" && t.usageType !== filter.usageType) return false

      // Card holder filter
      if (filter.cardHolder !== "전체" && t.cardHolder !== filter.cardHolder) return false

      // Date filter
      if (t.date < filter.dateFrom || t.date > filter.dateTo) return false

      // Account name filter
      if (filter.accountName && t.accountName && !t.accountName.includes(filter.accountName)) {
        return false
      }

      // Search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase()
        const matchAmount = t.amount.toString().includes(query)
        const matchMerchant = t.merchant.toLowerCase().includes(query)
        const matchAccount = t.accountName?.toLowerCase().includes(query)
        const matchBusinessType = t.businessType.toLowerCase().includes(query)
        const matchApprovalNumber = t.approvalNumber.toLowerCase().includes(query)
        if (!matchAmount && !matchMerchant && !matchAccount && !matchBusinessType && !matchApprovalNumber) {
          return false
        }
      }

      return true
    })
  }, [transactions, filter])

  // 취소 매칭 거래 (동일 사용처 + 승인번호)
  const matchingTransactionsForCancel = useMemo(() => {
    if (!selectedTransaction) return []
    return transactions.filter(
      (t) =>
        t.id !== selectedTransaction.id &&
        t.merchant === selectedTransaction.merchant &&
        t.approvalNumber === selectedTransaction.approvalNumber &&
        t.status === "미처리"
    )
  }, [selectedTransaction, transactions])

  const isEditable = useMemo(() => {
    return selectedTransaction?.status === "미처리" || selectedTransaction?.status === "반려"
  }, [selectedTransaction])

  // Handlers
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type, visible: true })
  }, [])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  const copyToClipboard = useCallback(
    (text: string) => {
      navigator.clipboard.writeText(text)
      showToast("클립보드에 복사되었습니다", "info")
    },
    [showToast]
  )

  const handleFilterChange = useCallback((value: FilterState | ((prev: FilterState) => FilterState)) => {
    setFilter((prev) =>
      typeof value === "function" ? value(prev) : value
    )
  }, [])

  const getAppContainerRect = useCallback(() => {
    const desktop = document.getElementById("app-content-desktop")
    const mobile = document.getElementById("app-content-mobile")
    const visible = desktop?.clientWidth ? desktop : mobile
    return visible?.getBoundingClientRect() ?? null
  }, [])

  const handleSearchOrigin = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    const buttonRect = event.currentTarget.getBoundingClientRect()
    const containerRect = getAppContainerRect()
    if (!containerRect) {
      setSearchOrigin({
        left: buttonRect.left,
        top: buttonRect.top,
        width: buttonRect.width,
        height: buttonRect.height,
      })
      return
    }
    setSearchOrigin({
      left: buttonRect.left - containerRect.left,
      top: buttonRect.top - containerRect.top,
      width: buttonRect.width,
      height: buttonRect.height,
    })
  }, [getAppContainerRect])

  const handleFilterAccountSelect = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    handleSearchOrigin(event)
    setAccountSelectTarget("filter")
    setReturnView("list")
    setView("account")
  }, [handleSearchOrigin])

  const handleTransactionClick = useCallback((transaction: CardTransaction) => {
    setSelectedTransaction(transaction)
    const defaultWbs = wbsOptions[0] || { code: "P260000", name: "SI 구축 프로젝트" }
    setForm({
      wbsCode: transaction.wbsCode || defaultWbs.code,
      wbsName: transaction.wbsName || defaultWbs.name,
      accountCode: transaction.accountCode || "",
      accountName: transaction.accountName || "",
      usageDescription: transaction.usageDescription || "",
      supplyAmount: transaction.supplyAmount,
      vatAmount: transaction.vatAmount,
      attachments: transaction.attachments || [],
      fuelType: transaction.fuelType || "",
      vehicleNumber: transaction.vehicleNumber || "",
    })
    setView("detail")
  }, [])

  const handleLongPress = useCallback((id: string) => {
    setIsSelectionMode(true)
    setSelectedItems([id])
  }, [])

  const handleSelect = useCallback((id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((i) => i !== id)
        if (next.length === 0) {
          setIsSelectionMode(false)
        }
        return next
      }
      return [...prev, id]
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === filteredTransactions.length && filteredTransactions.length > 0) {
      setSelectedItems([])
      setIsSelectionMode(false)
    } else {
      setSelectedItems(filteredTransactions.map((t) => t.id))
      setIsSelectionMode(true)
    }
  }, [filteredTransactions, selectedItems.length])

  const cancelSelection = useCallback(() => {
    setIsSelectionMode(false)
    setSelectedItems([])
  }, [])

  const handleBatchCancel = useCallback(() => {
    const selected = transactions.filter((t) => selectedItems.includes(t.id))
    const merchants = [...new Set(selected.map((t) => t.merchant))]
    const approvalNumbers = [...new Set(selected.map((t) => t.approvalNumber))]
    const totalAmount = selected.reduce((sum, t) => sum + t.amount, 0)

    if (merchants.length > 1 || approvalNumbers.length > 1) {
      showToast("사용처와 승인번호가 동일한 건만 취소처리 가능합니다", "error")
      return
    }

    if (totalAmount !== 0) {
      showToast("선택된 건들의 금액 합계가 0이어야 취소처리 가능합니다", "error")
      return
    }

    setTransactions((prev) =>
      prev.map((t) =>
        selectedItems.includes(t.id) ? { ...t, status: "취소처리" as const } : t
      )
    )
    showToast("취소처리되었습니다")
    cancelSelection()
  }, [transactions, selectedItems, showToast, cancelSelection])

  const returnToListWithAnimation = useCallback(() => {
    if (view === "list") return;

    setIsPageLeaving(true)
    // 오버레이가 닫힐 때 하단의 상세화면이 부드럽게 빠져나가도록 상태를 먼저 전환
    if (["approval", "cancelMatch", "wbs", "account"].includes(view)) {
      setView(returnView)
    }

    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current)
    }
    transitionTimeoutRef.current = window.setTimeout(() => {
      setIsPageLeaving(false)
      setDragOffset(0)
      setDragStartX(null)
      setView("list")
      setSelectedTransaction(null)
      setApprovalMode(null)
    }, 260)
  }, [view, returnView])

  const handleBatchSubmit = useCallback(() => {
    const selected = transactions.filter((t) => selectedItems.includes(t.id))
    if (selected.length === 0) {
      showToast("선택된 건이 없습니다", "error")
      return
    }

    setTransactions((prev) =>
      prev.map((t) =>
        selectedItems.includes(t.id)
          ? {
              ...t,
              status: "진행 중-현업" as const,
            }
          : t
      )
    )
    showToast("상신 처리되었습니다")
    cancelSelection()
  }, [selectedItems, showToast, cancelSelection])

  const handleBatchPersonalUse = useCallback(() => {
    const selected = transactions.filter((t) => selectedItems.includes(t.id))
    if (selected.length === 0) {
      showToast("선택된 건이 없습니다", "error")
      return
    }

    setTransactions((prev) =>
      prev.map((t) =>
        selectedItems.includes(t.id) ? { ...t, status: "개인사용" as const } : t
      )
    )
    showToast("개인사용 처리되었습니다")
    cancelSelection()
  }, [selectedItems, showToast, cancelSelection])

  const handleBatchEdit = useCallback(() => {
    const selected = transactions.filter((t) => selectedItems.includes(t.id))
    if (selected.length === 0) {
      showToast("선택된 건이 없습니다", "error")
      return
    }

    const defaultWbs = wbsOptions[0] || { code: "P260000", name: "SI 구축 프로젝트" }
    const base = selected[0]

    setForm({
      wbsCode: base.wbsCode || defaultWbs.code,
      wbsName: base.wbsName || defaultWbs.name,
      accountCode: base.accountCode || "",
      accountName: base.accountName || "",
      usageDescription: base.usageDescription || "",
      supplyAmount: base.supplyAmount,
      vatAmount: base.vatAmount,
      attachments: base.attachments || [],
      fuelType: base.fuelType || "",
      vehicleNumber: base.vehicleNumber || "",
    })
    setView("batchEdit")
  }, [transactions, selectedItems, showToast])

  const handleBatchEditSaveDraft = useCallback(() => {
    if (selectedItems.length === 0) {
      showToast("선택된 건이 없습니다", "error")
      return
    }

    setTransactions((prev) =>
      prev.map((t) =>
        selectedItems.includes(t.id)
          ? {
              ...t,
              wbsCode: form.wbsCode,
              wbsName: form.wbsName,
              accountCode: form.accountCode,
              accountName: form.accountName,
              usageDescription: form.usageDescription,
              supplyAmount: form.supplyAmount,
              vatAmount: form.vatAmount,
              attachments: form.attachments,
              fuelType: form.fuelType || undefined,
              vehicleNumber: form.vehicleNumber || undefined,
            }
          : t
      )
    )
    showToast("임시저장되었습니다")
    cancelSelection()
    returnToListWithAnimation()
  }, [form, selectedItems, showToast, cancelSelection])

  const handleBatchEditSubmit = useCallback(() => {
    if (!form.wbsCode || !form.accountCode || !form.usageDescription) {
      showToast("필수 입력 항목을 모두 입력해주세요", "error")
      return
    }

    if (selectedItems.length === 0) {
      showToast("선택된 건이 없습니다", "error")
      return
    }

    setReturnView("batchEdit")
    setApprovalMode("batch")
    setView("approval")
  }, [form, selectedItems, showToast])

  const handleFormChange = useCallback((newForm: FormState) => {
    setForm(newForm)
  }, [])

  const handleSubmit = useCallback(() => {
    // Validation
    if (!form.wbsCode || !form.accountCode || !form.usageDescription) {
      showToast("필수 입력 항목을 모두 입력해주세요", "error")
      return
    }

    // 차량유지비인 경우 추가 검증
    const selectedAccount = accountOptions.find((a) => a.code === form.accountCode)
    if (selectedAccount?.hasExtraFields) {
      if (!form.fuelType || !form.vehicleNumber) {
        showToast("보조정보를 모두 입력해주세요", "error")
        return
      }
    }

    // 필수 첨부 검증
    if (selectedTransaction?.requiresAttachment && form.attachments.length === 0) {
      showToast("증빙서류를 첨부해주세요", "error")
      return
    }

    setReturnView("detail")
    setApprovalMode("detail")
    setView("approval")
  }, [form, selectedTransaction, showToast])

  const confirmSubmit = useCallback(
    (finalApprovers: Approver[]) => {
      let budgetMsg = ""
      if (["회의비", "복리후생비-업무추진식대", "시내교통비"].includes(form.accountName) && form.wbsCode) {
        const hash = (form.wbsCode + form.accountName).split("").reduce((a, b) => a + b.charCodeAt(0), 0)
        const total = ((hash % 10) + 3) * 1000000
        const used = ((hash % 7) + 1) * 350000
        const remaining = total - used
        budgetMsg = ` (잔여예산: ${remaining.toLocaleString()}원)`
      }

      if (approvalMode === "batch") {
        if (selectedItems.length === 0) {
          showToast("선택된 건이 없습니다", "error")
          setView("list")
          setApprovalMode(null)
          return
        }

        setTransactions((prev) =>
          prev.map((t) =>
            selectedItems.includes(t.id)
              ? {
                  ...t,
                  status: "진행 중-현업" as const,
                  wbsCode: form.wbsCode,
                  wbsName: form.wbsName,
                  accountCode: form.accountCode,
                  accountName: form.accountName,
                  usageDescription: form.usageDescription,
                  supplyAmount: form.supplyAmount,
                  vatAmount: form.vatAmount,
                  attachments: form.attachments,
                  fuelType: form.fuelType || undefined,
                  vehicleNumber: form.vehicleNumber || undefined,
                }
              : t
          )
        )
        setApprovers(finalApprovers)
        showToast(`상신되었습니다${budgetMsg}`)
        cancelSelection()
        returnToListWithAnimation()
      } else if (selectedTransaction) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === selectedTransaction.id
              ? {
                  ...t,
                  status: "진행 중-현업" as const,
                  wbsCode: form.wbsCode,
                  wbsName: form.wbsName,
                  accountCode: form.accountCode,
                  accountName: form.accountName,
                  usageDescription: form.usageDescription,
                  supplyAmount: form.supplyAmount,
                  vatAmount: form.vatAmount,
                  attachments: form.attachments,
                  fuelType: form.fuelType || undefined,
                  vehicleNumber: form.vehicleNumber || undefined,
                }
              : t
          )
        )
        setApprovers(finalApprovers)
        showToast(`상신되었습니다${budgetMsg}`)
        returnToListWithAnimation()
      }
    },
    [approvalMode, selectedItems, selectedTransaction, form, showToast, cancelSelection, returnToListWithAnimation]
  )

  const handleSaveDraft = useCallback(() => {
    if (selectedTransaction) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === selectedTransaction.id
            ? {
                ...t,
                wbsCode: form.wbsCode,
                wbsName: form.wbsName,
                accountCode: form.accountCode,
                accountName: form.accountName,
                usageDescription: form.usageDescription,
                supplyAmount: form.supplyAmount,
                vatAmount: form.vatAmount,
                attachments: form.attachments,
                fuelType: form.fuelType || undefined,
                vehicleNumber: form.vehicleNumber || undefined,
              }
            : t
        )
      )
      showToast("임시저장되었습니다")
      returnToListWithAnimation()
    }
  }, [selectedTransaction, form, showToast, returnToListWithAnimation])

  const handlePersonalUse = useCallback(() => {
    if (selectedTransaction) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === selectedTransaction.id ? { ...t, status: "개인사용" as const } : t
        )
      )
      showToast("개인사용 처리되었습니다")
      returnToListWithAnimation()
    }
  }, [selectedTransaction, showToast, returnToListWithAnimation])

  const handleCancelTransaction = useCallback(() => {
    // 상세화면에서 취소처리 시 매칭 화면 표시
    if (matchingTransactionsForCancel.length > 0) {
      setReturnView("detail")
      setView("cancelMatch")
    } else {
      // 매칭 건이 없으면 바로 취소 (단, 금액이 0이어야 함)
      if (selectedTransaction && selectedTransaction.amount !== 0) {
        showToast("취소처리할 수 없습니다. 금액 합계가 0이 아닙니다.", "error")
        return
      }
      if (selectedTransaction) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === selectedTransaction.id ? { ...t, status: "취소처리" as const } : t
          )
        )
        showToast("취소처리되었습니다")
        returnToListWithAnimation()
      }
    }
  }, [selectedTransaction, matchingTransactionsForCancel, showToast, returnToListWithAnimation])

  const confirmCancelMatch = useCallback(
    (selectedIds: string[]) => {
      setTransactions((prev) =>
        prev.map((t) =>
          selectedIds.includes(t.id) ? { ...t, status: "취소처리" as const } : t
        )
      )
      showToast("취소처리되었습니다")
      returnToListWithAnimation()
    },
    [showToast, returnToListWithAnimation]
  )

  const handleWbsSelect = useCallback(
    (wbs: { code: string; name: string }) => {
      setForm((prev) => ({ ...prev, wbsCode: wbs.code, wbsName: wbs.name }))
      setView(returnView)
    },
    [returnView]
  )

  const handleAccountSelect = useCallback(
    (account: { code: string; name: string }) => {
      if (accountSelectTarget === "filter") {
        setFilter((prev) => ({
          ...prev,
          accountName: account.name,
        }))
      } else {
        setForm((prev) => ({
          ...prev,
          accountCode: account.code,
          accountName: account.name,
          // 계정 변경 시 보조정보 초기화
          fuelType: "",
          vehicleNumber: "",
        }))
      }
      setView(returnView)
    },
    [accountSelectTarget, returnView]
  )

  useEffect(() => {
    if (view === "detail" || view === "batchEdit") {
      setIsPageLeaving(false)
      // WBS/계정 검색 모달에서 돌아오는 경우 애니메이션 없이 바로 표시
      if (["wbs", "account", "approval", "cancelMatch"].includes(prevViewRef.current)) {
        setSkipTransition(true)
        setOverlayVisible(true)
        requestAnimationFrame(() => setSkipTransition(false))
      } else {
        requestAnimationFrame(() => setOverlayVisible(true))
      }
      } else if (["wbs", "account", "approval", "cancelMatch"].includes(view)) {
        // 모달이 열릴 때 뒷 배경(상세화면 등)이 사라지지 않도록 오버레이 유지
        setOverlayVisible(true)
    } else {
      setOverlayVisible(false)
    }
    prevViewRef.current = view
  }, [view])

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  const handleBack = useCallback(() => {
    setSearchOrigin(null)
    if (view === "detail" || view === "batchEdit") {
      setIsPageLeaving(true)
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current)
      }
      transitionTimeoutRef.current = window.setTimeout(() => {
        setIsPageLeaving(false)
        setDragOffset(0)
        setDragStartX(null)
        setView("list")
        if (view === "detail") {
          setSelectedTransaction(null)
        }
      }, 260)
      return
    }

    if (view === "wbs" || view === "account" || view === "approval") {
      setView(returnView)
    } else if (view === "cancelMatch") {
      setView("detail")
    } else {
      setView("list")
      setSelectedTransaction(null)
    }
  }, [view, returnView])

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.clientX <= 24) {
      setDragStartX(event.clientX)
      setDragOffset(0)
    }
  }, [])

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (dragStartX === null) return
      const delta = event.clientX - dragStartX
      if (delta > 0) {
        setDragOffset(Math.min(delta, 220))
      }
    },
    [dragStartX]
  )

  const handlePointerUp = useCallback(() => {
    if (dragStartX === null) return
    if (dragOffset > 90) {
      handleBack()
    } else {
      setDragOffset(0)
    }
    setDragStartX(null)
  }, [dragStartX, dragOffset, handleBack])

  const overlayTransform = overlayVisible
    ? `translateX(calc(${isPageLeaving ? 100 : 0}% + ${dragOffset}px))`
    : `translateX(100%)`
  const overlayTransition = dragStartX !== null || skipTransition ? "none" : "transform 260ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease-in-out"

  // Render content based on view
  const renderContent = () => {
    const baseView = (["wbs", "account", "approval", "cancelMatch"].includes(view)) ? returnView : view

    // 공통 ListScreen 렌더링 (상태 유지를 위해 항상 동일한 구조 내부에 렌더링)
    const baseContent = (
      <div className="relative h-full">
        <ListScreen
          filter={filter}
          onFilterChange={handleFilterChange}
          isFilterActive={isFilterActive}
          filteredTransactions={filteredTransactions}
          selectedItems={selectedItems}
          isSelectionMode={isSelectionMode}
          onSelect={handleSelect}
          onClick={handleTransactionClick}
          onLongPress={handleLongPress}
          onCancelSelection={cancelSelection}
          onBatchCancel={handleBatchCancel}
          onBatchEdit={handleBatchEdit}
          onBatchSubmit={handleBatchSubmit}
          onBatchPersonalUse={handleBatchPersonalUse}
          onFilterAccountSelect={handleFilterAccountSelect}
          onSelectAll={handleSelectAll}
        />
        
        {baseView === "detail" && selectedTransaction && (
          <div
            className="absolute inset-0 z-30 bg-white shadow-xl"
            style={{
              transform: overlayTransform,
              opacity: isPageLeaving ? 0 : 1,
              transition: overlayTransition,
              touchAction: "pan-y",
            }}
          >
            <div
              className="absolute inset-y-0 left-0 w-6 z-40"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
            <DetailScreen
              selectedTransaction={selectedTransaction}
              form={form}
              isEditable={isEditable}
              onBack={handleBack}
              onFormChange={handleFormChange}
              onWbsClick={(event) => {
                handleSearchOrigin(event)
                setReturnView("detail")
                setView("wbs")
              }}
              onAccountClick={(event) => {
                handleSearchOrigin(event)
                setAccountSelectTarget("form")
                setReturnView("detail")
                setView("account")
              }}
              onCopy={copyToClipboard}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              onPersonalUse={handlePersonalUse}
              onCancel={handleCancelTransaction}
            />
          </div>
        )}

        {baseView === "batchEdit" && (
          <div
            className="absolute inset-0 z-30 bg-white shadow-xl"
            style={{
              transform: overlayTransform,
              opacity: isPageLeaving ? 0 : 1,
              transition: overlayTransition,
              touchAction: "pan-y",
            }}
          >
            <div
              className="absolute inset-y-0 left-0 w-6 z-40"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
            <BatchEditScreen
              selectedTransactions={transactions.filter((t) => selectedItems.includes(t.id))}
              form={form}
              isEditable={true}
              onBack={handleBack}
              onFormChange={handleFormChange}
              onWbsClick={(event) => {
                handleSearchOrigin(event)
                setReturnView("batchEdit")
                setView("wbs")
              }}
              onAccountClick={(event) => {
                handleSearchOrigin(event)
                setAccountSelectTarget("form")
                setReturnView("batchEdit")
                setView("account")
              }}
              onCopy={copyToClipboard}
              onSaveDraft={handleBatchEditSaveDraft}
              onSubmit={handleBatchEditSubmit}
              onPersonalUse={handleBatchPersonalUse}
              onCancel={cancelSelection}
            />
          </div>
        )}
      </div>
    )

    return (
      <>
        {baseContent}
        {view === "wbs" && (
          <SearchModal
            type="wbs"
            options={wbsOptions}
            originRect={searchOrigin}
            onSelect={handleWbsSelect}
            onClose={handleBack}
          />
        )}
        {view === "account" && (
          <SearchModal
            type="account"
            options={accountOptions}
            originRect={searchOrigin}
            onSelect={handleAccountSelect}
            onClose={handleBack}
          />
        )}
        {view === "approval" && (
          <div className="absolute inset-0 z-50 overflow-hidden">
            <ApprovalModal
              approvers={approvers}
              onConfirm={confirmSubmit}
              onClose={handleBack}
            />
          </div>
        )}
        {view === "cancelMatch" && selectedTransaction && (
          <div className="absolute inset-0 z-50 overflow-hidden">
            <CancelMatchModal
              currentTransaction={selectedTransaction}
              matchingTransactions={matchingTransactionsForCancel}
              onConfirm={confirmCancelMatch}
              onClose={handleBack}
            />
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {/* PC: Mobile device frame */}
      <div className="hidden md:flex min-h-screen bg-gray-100 items-center justify-center p-8">
        <div className="w-[360px] h-[800px] bg-white rounded-[40px] shadow-2xl overflow-hidden relative">
          {/* Status bar mock */}
          <div className="h-11 bg-gray-900 flex items-center justify-center">
            <div className="w-20 h-5 bg-black rounded-full" />
          </div>
          {/* Content */}
          <div id="app-content-desktop" className="h-[calc(100%-44px)] overflow-hidden relative">
            {renderContent()}
          </div>
          <ToastNotification
            message={toast.message}
            type={toast.type}
            visible={toast.visible}
            onHide={hideToast}
          />
        </div>
      </div>

      {/* Mobile: Full screen */}
      <div id="app-content-mobile" className="md:hidden h-screen relative overflow-hidden">
        {renderContent()}
        <ToastNotification
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onHide={hideToast}
        />
      </div>
    </>
  )
}
