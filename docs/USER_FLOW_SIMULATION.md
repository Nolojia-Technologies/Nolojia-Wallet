# User Flow Simulation - Nolojia Wallet

This document demonstrates how the system works through a complete user journey from registration to fraud verification.

## Scenario: Second-Hand Phone Purchase with Fraud Verification

### Step 1: Buyer Registration and KYC
**John (Buyer)** wants to buy a second-hand iPhone.

1. **Account Creation**
   ```bash
   POST /api/auth/register
   {
     "email": "john.buyer@gmail.com",
     "phone": "+254712345678",
     "firstName": "John",
     "lastName": "Buyer",
     "nationalId": "12345678",
     "kraPin": "A123456789B",
     "password": "BuyerPass123!"
   }
   ```

   **System Response:**
   - Creates user account with Trust Score: 5.0
   - Generates User Code: "JB12X8Y9"
   - Creates wallet with KES 0 balance
   - Issues JWT token

2. **KYC Verification**
   ```bash
   POST /api/auth/verify-kyc
   Authorization: Bearer {john_token}
   {
     "kraPin": "A123456789B"
   }
   ```

   **System Response:**
   - Validates National ID with mock KRA API
   - Marks user as verified
   - Updates account status

### Step 2: Seller Registration
**Mary (Seller)** wants to sell her iPhone.

1. **Account Creation**
   ```bash
   POST /api/auth/register
   {
     "email": "mary.seller@gmail.com",
     "phone": "+254722334455",
     "firstName": "Mary",
     "lastName": "Seller",
     "nationalId": "87654321",
     "password": "SellerPass123!"
   }
   ```

   **System Response:**
   - Creates user account
   - Generates User Code: "MS87A4B5"
   - Creates wallet

### Step 3: Wallet Funding (Buyer)
John deposits money via M-Pesa to fund the purchase.

1. **Initiate M-Pesa Deposit**
   ```bash
   POST /api/wallet/deposit
   Authorization: Bearer {john_token}
   {
     "amount": 55000.00,
     "phone": "+254712345678",
     "method": "MPESA"
   }
   ```

   **System Response:**
   - Initiates M-Pesa STK Push
   - Creates pending deposit transaction
   - Returns transaction reference

2. **M-Pesa Callback (Simulated)**
   ```bash
   POST /api/payments/mpesa/callback
   {
     "Body": {
       "stkCallback": {
         "MerchantRequestID": "123456",
         "CheckoutRequestID": "ws_CO_123456",
         "ResultCode": 0,
         "ResultDesc": "Success",
         "CallbackMetadata": {
           "Item": [
             {"Name": "Amount", "Value": 55000},
             {"Name": "MpesaReceiptNumber", "Value": "QGR7X8Y9Z0"}
           ]
         }
       }
     }
   }
   ```

   **System Response:**
   - Updates transaction status to COMPLETED
   - Credits John's wallet: KES 55,000.00
   - Generates transaction receipt

### Step 4: Trust Score Verification
Before proceeding, John checks Mary's trust score.

1. **Check Seller's Trust Score**
   ```bash
   GET /api/fraud/check/MS87A4B5
   ```

   **System Response:**
   ```json
   {
     "success": true,
     "data": {
       "userCode": "MS87A4B5",
       "trustScore": 5.0,
       "status": "CLEAN",
       "isVerified": false,
       "reportsCount": 0,
       "badges": ["New User"]
     }
   }
   ```

### Step 5: Escrow Transaction Creation
John creates an escrow transaction for the iPhone purchase.

1. **Create Escrow Transaction**
   ```bash
   POST /api/escrow/create
   Authorization: Bearer {john_token}
   {
     "sellerId": "mary_user_id",
     "amount": 50000.00,
     "itemDescription": "iPhone 12 Pro Max 256GB Space Gray",
     "itemImages": ["iphone_front.jpg", "iphone_back.jpg"],
     "itemSerialNumber": "F2LLD8UDPPHF",
     "itemImeiNumber": "356728115793456",
     "deliveryAddress": "Westlands, Nairobi",
     "expiresInDays": 7
   }
   ```

   **System Response:**
   - Creates escrow transaction with status: CREATED
   - Moves KES 50,000 from John's balance to escrow
   - John's balance: KES 5,000, Escrow: KES 50,000
   - Notifies Mary about the escrow transaction

### Step 6: Seller Accepts and Ships Item
Mary confirms the escrow and ships the iPhone.

1. **Accept Escrow (Mary)**
   ```bash
   POST /api/escrow/{escrow_id}/accept
   Authorization: Bearer {mary_token}
   ```

   **System Response:**
   - Updates escrow status to FUNDED
   - Notifies John that item will be shipped

2. **Update Tracking (Mary)**
   ```bash
   POST /api/escrow/{escrow_id}/update
   Authorization: Bearer {mary_token}
   {
     "trackingNumber": "TRK123456789",
     "status": "SHIPPED"
   }
   ```

### Step 7: Item Delivery and Verification
John receives the iPhone and needs to confirm receipt.

1. **Confirm Receipt**
   ```bash
   POST /api/escrow/{escrow_id}/confirm
   Authorization: Bearer {john_token}
   {
     "pin": "1234"
   }
   ```

   **System Response:**
   - Updates escrow status to CONFIRMED
   - Releases KES 50,000 from escrow to Mary's wallet
   - Creates completion transactions
   - Generates digital receipt

### Step 8: Digital Receipt Generation
System automatically generates a tamper-proof digital receipt.

1. **Auto-Generated Receipt**
   ```json
   {
     "receiptNumber": "RCP1641234567890ABC",
     "transactionId": "txn_uuid",
     "sellerId": "mary_user_id",
     "buyerId": "john_user_id",
     "items": [{
       "name": "iPhone 12 Pro Max",
       "description": "256GB Space Gray",
       "quantity": 1,
       "unitPrice": 50000,
       "serialNumber": "F2LLD8UDPPHF",
       "imeiNumber": "356728115793456"
     }],
     "totalAmount": 50000,
     "qrCode": "data:image/png;base64,iVBOR...",
     "digitalSignature": "3e4f5g6h7i8j9k0l...",
     "verificationUrl": "https://verify.nolojia.com/RCP1641234567890ABC"
   }
   ```

### Step 9: Police Verification (3 Months Later)
Police officer discovers the phone during a routine check and verifies authenticity.

1. **QR Code Scan by Police**
   Police scans QR code on receipt or enters receipt number:
   ```bash
   GET /api/receipts/verify/RCP1641234567890ABC
   ```

   **System Response:**
   ```json
   {
     "success": true,
     "data": {
       "receiptNumber": "RCP1641234567890ABC",
       "isVerified": true,
       "item": {
         "name": "iPhone 12 Pro Max",
         "serialNumber": "F2LLD8UDPPHF",
         "imeiNumber": "356728115793456"
       },
       "seller": {
         "name": "Mary Seller",
         "userCode": "MS87A4B5",
         "trustScore": 5.0,
         "phone": "+254722***455"
       },
       "buyer": {
         "name": "John Buyer",
         "userCode": "JB12X8Y9",
         "trustScore": 5.0,
         "phone": "+254712***678"
       },
       "transactionDate": "2024-01-15T10:30:00Z",
       "verificationStatus": "✅ LEGITIMATE PURCHASE"
     }
   }
   ```

### Step 10: Fraud Scenario (Alternative Path)
If the phone was stolen, here's how the system would handle it:

1. **Fraud Report by Original Owner**
   ```bash
   POST /api/fraud/report
   Authorization: Bearer {original_owner_token}
   {
     "reportedUserCode": "MS87A4B5",
     "fraudType": "STOLEN_GOODS",
     "reason": "This is my stolen iPhone, serial: F2LLD8UDPPHF",
     "evidence": ["police_report.pdf", "original_receipt.jpg"],
     "amountInvolved": 120000.00
   }
   ```

2. **System Investigation**
   - Updates Mary's trust score to 2.0
   - Changes trust status to FLAGGED
   - Notifies all parties involved
   - Flags the digital receipt

3. **Police Re-verification**
   ```bash
   GET /api/receipts/verify/RCP1641234567890ABC
   ```

   **Updated Response:**
   ```json
   {
     "success": true,
     "data": {
       "receiptNumber": "RCP1641234567890ABC",
       "isVerified": true,
       "isFlagged": true,
       "flagReason": "Item reported as stolen",
       "seller": {
         "trustScore": 2.0,
         "trustStatus": "FLAGGED"
       },
       "verificationStatus": "⚠️ FLAGGED - INVESTIGATE FURTHER"
     }
   }
   ```

## Key Features Demonstrated

### 1. **Complete Audit Trail**
- Every transaction is immutable and traceable
- Digital receipts provide permanent proof of purchase
- QR codes enable instant verification

### 2. **Trust System**
- Dynamic trust scores based on behavior
- Public verification system
- Reputation-based commerce

### 3. **Escrow Protection**
- Buyer funds are protected until delivery confirmation
- Dispute resolution mechanism
- Automatic fund release

### 4. **Fraud Prevention**
- Real-time fraud reporting
- Trust score impact
- Police verification system

### 5. **Integration Ready**
- M-Pesa payment integration
- KRA KYC validation
- E-commerce platform APIs

## User Benefits

### For Buyers:
- **Protection**: Funds held in escrow until satisfied
- **Verification**: Can check seller's trust score
- **Proof**: Permanent digital receipts
- **Recourse**: Dispute resolution system

### For Sellers:
- **Trust Building**: Reputation system rewards good behavior
- **Payment Security**: Guaranteed payment through escrow
- **Legitimacy**: Digital receipts prove legitimate business

### For Law Enforcement:
- **Instant Verification**: QR code scanning for authenticity
- **Investigation Tools**: Complete transaction history
- **Fraud Detection**: Flagged items and users
- **Evidence**: Immutable transaction records

### For Businesses:
- **Payroll Integration**: Automated salary processing
- **Bulk Operations**: CSV upload for mass payments
- **Compliance**: Automatic tax logging and KRA integration

This simulation shows how Nolojia Wallet creates a complete ecosystem for secure, transparent, and traceable digital commerce in Kenya.