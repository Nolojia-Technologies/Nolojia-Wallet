import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "KSH"): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency === "KSH" ? "KES" : currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatPhoneNumber(phone: string): string {
  // Format Kenyan phone numbers
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.startsWith("254")) {
    return `+${cleaned}`
  } else if (cleaned.startsWith("0")) {
    return `+254${cleaned.slice(1)}`
  } else if (cleaned.length === 9) {
    return `+254${cleaned}`
  }

  return phone
}

export function generateTransactionRef(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `TXN${timestamp}${random}`.toUpperCase()
}

export function generateUserCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}