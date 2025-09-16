// User and Authentication Types
export interface User {
  id: string
  email: string
  phone: string
  firstName: string
  lastName: string
  nationalId: string
  kraPin?: string
  userCode: string
  trustScore: number
  isVerified: boolean
  isBlacklisted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RegisterRequest {
  email: string
  phone: string
  firstName: string
  lastName: string
  nationalId: string
  kraPin?: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

// Wallet Types
export interface Wallet {
  id: string
  userId: string
  balance: number
  currency: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  id: string
  reference: string
  fromWalletId?: string
  toWalletId?: string
  amount: number
  fee: number
  currency: string
  type: TransactionType
  status: TransactionStatus
  description: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER = "TRANSFER",
  ESCROW_CREATE = "ESCROW_CREATE",
  ESCROW_RELEASE = "ESCROW_RELEASE",
  ESCROW_REFUND = "ESCROW_REFUND",
  PAYROLL = "PAYROLL",
  FEE = "FEE"
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

// Escrow Types
export interface EscrowTransaction {
  id: string
  buyerId: string
  sellerId: string
  amount: number
  currency: string
  itemDescription: string
  itemImages?: string[]
  itemSerialNumber?: string
  status: EscrowStatus
  transactionId: string
  releaseDate?: Date
  disputeReason?: string
  createdAt: Date
  updatedAt: Date
}

export enum EscrowStatus {
  CREATED = "CREATED",
  FUNDED = "FUNDED",
  CONFIRMED = "CONFIRMED",
  RELEASED = "RELEASED",
  DISPUTED = "DISPUTED",
  REFUNDED = "REFUNDED"
}

// Fraud Types
export interface FraudReport {
  id: string
  reporterId: string
  reportedUserId: string
  reason: string
  evidence?: string[]
  status: FraudReportStatus
  createdAt: Date
  updatedAt: Date
}

export enum FraudReportStatus {
  SUBMITTED = "SUBMITTED",
  INVESTIGATING = "INVESTIGATING",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED"
}

export interface TrustScore {
  userId: string
  score: number
  status: TrustStatus
  factors: TrustFactor[]
  lastUpdated: Date
}

export enum TrustStatus {
  CLEAN = "CLEAN",
  FLAGGED = "FLAGGED",
  BLACKLISTED = "BLACKLISTED"
}

export interface TrustFactor {
  type: string
  weight: number
  description: string
}

// Digital Receipt Types
export interface DigitalReceipt {
  id: string
  transactionId: string
  sellerId: string
  buyerId: string
  items: ReceiptItem[]
  totalAmount: number
  currency: string
  qrCode: string
  signature: string
  isVerified: boolean
  createdAt: Date
}

export interface ReceiptItem {
  name: string
  description: string
  quantity: number
  unitPrice: number
  serialNumber?: string
  imeiNumber?: string
  images?: string[]
}

// Payroll Types
export interface PayrollBatch {
  id: string
  companyId: string
  batchName: string
  totalEmployees: number
  totalAmount: number
  processedEmployees: number
  status: PayrollStatus
  uploadedFile?: string
  createdAt: Date
  processedAt?: Date
}

export interface PayrollEntry {
  id: string
  batchId: string
  employeeId: string
  employeeName: string
  nationalId: string
  phone: string
  grossSalary: number
  deductions: PayrollDeduction[]
  netSalary: number
  status: PayrollEntryStatus
  transactionId?: string
  processedAt?: Date
}

export interface PayrollDeduction {
  type: string
  amount: number
  description: string
}

export enum PayrollStatus {
  UPLOADED = "UPLOADED",
  VALIDATING = "VALIDATING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

export enum PayrollEntryStatus {
  PENDING = "PENDING",
  PROCESSED = "PROCESSED",
  FAILED = "FAILED"
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// UI Types
export interface PageProps {
  children?: React.ReactNode
}

export interface FormField {
  name: string
  label: string
  type: string
  placeholder?: string
  required?: boolean
  validation?: any
}