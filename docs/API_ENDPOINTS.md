# Nolojia Wallet API Endpoints

Base URL: `http://localhost:3001/api`

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "phone": "+254712345678",
  "firstName": "John",
  "lastName": "Doe",
  "nationalId": "12345678",
  "kraPin": "A000000000A",
  "password": "StrongPassword123!"
}
```

### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "StrongPassword123!"
}
```

### Verify KYC
```
POST /auth/verify-kyc
Authorization: Bearer {token}
Content-Type: application/json

{
  "kraPin": "A000000000A"
}
```

### Get Profile
```
GET /auth/profile
Authorization: Bearer {token}
```

### Refresh Token
```
POST /auth/refresh
Authorization: Bearer {token}
```

### Logout
```
POST /auth/logout
Authorization: Bearer {token}
```

## Wallet Endpoints

### Get Wallet Balance
```
GET /wallet/balance
Authorization: Bearer {token}
```

### Get Wallet Details
```
GET /wallet
Authorization: Bearer {token}
```

### Send Money
```
POST /wallet/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipientPhone": "+254712345678",
  "amount": 1000.00,
  "description": "Payment for services",
  "pin": "1234"
}
```

### Deposit Money (M-Pesa)
```
POST /wallet/deposit
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 1000.00,
  "phone": "+254712345678",
  "method": "MPESA"
}
```

### Withdraw Money
```
POST /wallet/withdraw
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 1000.00,
  "phone": "+254712345678",
  "method": "MPESA",
  "pin": "1234"
}
```

## Transaction Endpoints

### Get Transaction History
```
GET /transactions?page=1&limit=10&type=TRANSFER&status=COMPLETED
Authorization: Bearer {token}
```

### Get Transaction Details
```
GET /transactions/{transactionId}
Authorization: Bearer {token}
```

### Get Transaction by Reference
```
GET /transactions/reference/{reference}
Authorization: Bearer {token}
```

## Escrow Endpoints

### Create Escrow Transaction
```
POST /escrow/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "sellerId": "uuid-of-seller",
  "amount": 5000.00,
  "itemDescription": "iPhone 12 Pro Max",
  "itemImages": ["image1.jpg", "image2.jpg"],
  "itemSerialNumber": "ABC123456",
  "deliveryAddress": "Nairobi, Kenya",
  "expiresInDays": 7
}
```

### Confirm Receipt
```
POST /escrow/{escrowId}/confirm
Authorization: Bearer {token}
Content-Type: application/json

{
  "pin": "1234"
}
```

### Raise Dispute
```
POST /escrow/{escrowId}/dispute
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Item not as described",
  "evidence": ["evidence1.jpg", "evidence2.jpg"]
}
```

### Get Escrow Details
```
GET /escrow/{escrowId}
Authorization: Bearer {token}
```

### Get User Escrow Transactions
```
GET /escrow/user?status=CREATED&page=1&limit=10
Authorization: Bearer {token}
```

## Fraud Prevention Endpoints

### Check User Trust Score
```
GET /fraud/check/{userCode}
```

### Report Fraud
```
POST /fraud/report
Authorization: Bearer {token}
Content-Type: application/json

{
  "reportedUserCode": "ABC12345",
  "fraudType": "FAKE_GOODS",
  "reason": "Sold fake iPhone",
  "evidence": ["evidence1.jpg"],
  "amountInvolved": 50000.00
}
```

### Get Fraud Reports
```
GET /fraud/reports?status=SUBMITTED&page=1&limit=10
Authorization: Bearer {token}
```

### Get Blacklist
```
GET /fraud/blacklist?page=1&limit=10
```

### Update Trust Score (Admin)
```
PUT /fraud/trust-score/{userId}
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "score": 3.5,
  "status": "FLAGGED",
  "reason": "Multiple fraud reports"
}
```

## Digital Receipts Endpoints

### Generate Receipt
```
POST /receipts/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "transactionId": "uuid-of-transaction",
  "items": [
    {
      "name": "iPhone 12 Pro Max",
      "description": "256GB Space Gray",
      "quantity": 1,
      "unitPrice": 120000,
      "serialNumber": "ABC123456",
      "images": ["phone1.jpg"]
    }
  ]
}
```

### Verify Receipt
```
GET /receipts/verify/{receiptNumber}
```

### Get Receipt Details
```
GET /receipts/{receiptId}
Authorization: Bearer {token}
```

### Get User Receipts
```
GET /receipts/user?page=1&limit=10
Authorization: Bearer {token}
```

### Download Receipt PDF
```
GET /receipts/{receiptId}/pdf
Authorization: Bearer {token}
```

## Payroll Endpoints

### Upload Payroll Batch
```
POST /payroll/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: payroll.csv
batchName: "January 2024 Salaries"
```

### Manual Payroll Entry
```
POST /payroll/manual
Authorization: Bearer {token}
Content-Type: application/json

{
  "batchName": "January 2024 Salaries",
  "entries": [
    {
      "employeeName": "John Doe",
      "nationalId": "12345678",
      "phone": "+254712345678",
      "email": "john@company.com",
      "grossSalary": 80000,
      "deductions": [
        {
          "type": "PAYE",
          "amount": 15000,
          "description": "Pay As You Earn"
        },
        {
          "type": "NHIF",
          "amount": 1700,
          "description": "National Hospital Insurance"
        }
      ]
    }
  ]
}
```

### Process Payroll Batch
```
POST /payroll/process/{batchId}
Authorization: Bearer {token}
```

### Get Payroll Batches
```
GET /payroll/batches?status=PROCESSING&page=1&limit=10
Authorization: Bearer {token}
```

### Get Payroll Batch Details
```
GET /payroll/batches/{batchId}
Authorization: Bearer {token}
```

### Get Employee Payroll History
```
GET /payroll/employee/{employeeId}?page=1&limit=10
Authorization: Bearer {token}
```

## Payment Integration Endpoints

### M-Pesa STK Push
```
POST /payments/mpesa/stk-push
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "+254712345678",
  "amount": 1000,
  "description": "Wallet top-up"
}
```

### M-Pesa Callback
```
POST /payments/mpesa/callback
Content-Type: application/json

{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "123456",
      "CheckoutRequestID": "ws_CO_123456",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 1000
          }
        ]
      }
    }
  }
}
```

### Airtel Money Payment (Mock)
```
POST /payments/airtel/payment
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "+254712345678",
  "amount": 1000,
  "description": "Wallet top-up"
}
```

## User Management Endpoints (Admin)

### Get All Users
```
GET /admin/users?page=1&limit=10&status=ACTIVE
Authorization: Bearer {admin-token}
```

### Get User Details
```
GET /admin/users/{userId}
Authorization: Bearer {admin-token}
```

### Update User Status
```
PUT /admin/users/{userId}/status
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "status": "SUSPENDED",
  "reason": "Violation of terms"
}
```

### Freeze Wallet
```
POST /admin/wallets/{walletId}/freeze
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "reason": "Suspected fraud"
}
```

## System Endpoints

### Health Check
```
GET /health
```

### System Stats (Admin)
```
GET /admin/stats
Authorization: Bearer {admin-token}
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    "Specific error details"
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  },
  "message": "Data retrieved successfully"
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited:
- Authentication: 5 requests per minute per IP
- General API: 100 requests per minute per user
- Payment endpoints: 10 requests per minute per user

## Authentication

Most endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Tokens expire after 1 hour and can be refreshed using the `/auth/refresh` endpoint.