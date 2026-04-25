// 법인카드 거래내역 타입
export interface CardTransaction {
  id: string
  status: TransactionStatus
  amount: number
  merchant: string
  businessType: string
  date: string
  time: string
  approvalNumber: string
  cardNumber: string
  cardHolder: string
  supplyAmount: number
  vatAmount: number
  managementNumber: string
  postingDate: string
  isCancelled: boolean
  usageType: "국내" | "해외"
  rejectReason?: string
  wbsCode?: string
  wbsName?: string
  accountCode?: string
  accountName?: string
  usageDescription?: string
  attachments?: AttachmentFile[]
  fuelType?: "Y" | "N"
  vehicleNumber?: string
  requiresAttachment?: boolean
}

export type TransactionStatus = 
  | "미처리" 
  | "진행 중-현업" 
  | "진행 중-회계" 
  | "검토완료" 
  | "지급완료" 
  | "개인사용" 
  | "취소처리" 
  | "반려"

export interface AttachmentFile {
  id: string
  name: string
  size: number
  type: string
}

export interface WbsOption {
  code: string
  name: string
}

export interface AccountOption {
  code: string
  name: string
  frequent: boolean
  hasExtraFields?: boolean
}

export interface Approver {
  id: string
  name: string
  position: string
  type: "승인" | "검토완료"
  order: number
}

export interface FilterState {
  status: string
  usageType: string
  cardHolder: string
  dateFrom: string
  dateTo: string
  accountName: string
  searchQuery: string
}

export interface FormState {
  wbsCode: string
  wbsName: string
  accountCode: string
  accountName: string
  usageDescription: string
  supplyAmount: number
  vatAmount: number
  attachments: AttachmentFile[]
  fuelType: "Y" | "N" | ""
  vehicleNumber: string
}
