export function generateUserCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateTransactionRef(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `TXN${timestamp}${random}`.toUpperCase();
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6);
  return `RCP${timestamp}${random}`.toUpperCase();
}