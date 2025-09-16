# Nolojia Wallet Database Schema

## Overview
This document describes the PostgreSQL database schema for the Nolojia Wallet platform.

## Entities

### Users Table
Stores user account information with KYC data and trust scores.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR UNIQUE NOT NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  national_id VARCHAR UNIQUE NOT NULL,
  kra_pin VARCHAR,
  user_code VARCHAR(8) UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  role user_role DEFAULT 'USER',
  trust_score DECIMAL(3,2) DEFAULT 5.0,
  trust_status trust_status DEFAULT 'CLEAN',
  is_verified BOOLEAN DEFAULT FALSE,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Wallets Table
One wallet per user for storing digital currency.

```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  balance DECIMAL(15,2) DEFAULT 0,
  escrow_balance DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR DEFAULT 'KES',
  is_active BOOLEAN DEFAULT TRUE,
  is_frozen BOOLEAN DEFAULT FALSE,
  daily_limit DECIMAL(15,2) DEFAULT 100000,
  daily_spent DECIMAL(15,2) DEFAULT 0,
  last_transaction_date DATE,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Transactions Table
Immutable ledger of all financial transactions.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference VARCHAR UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  from_wallet_id UUID REFERENCES wallets(id),
  to_wallet_id UUID REFERENCES wallets(id),
  amount DECIMAL(15,2) NOT NULL,
  fee DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR DEFAULT 'KES',
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'PENDING',
  payment_method payment_method,
  description TEXT,
  external_reference VARCHAR,
  metadata JSON,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Escrow Transactions Table
Manages buyer-seller escrow transactions.

```sql
CREATE TABLE escrow_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR DEFAULT 'KES',
  item_description TEXT NOT NULL,
  item_images JSON,
  item_serial_number VARCHAR,
  item_imei_number VARCHAR,
  status escrow_status DEFAULT 'CREATED',
  tracking_number VARCHAR,
  delivery_address TEXT,
  expires_at TIMESTAMP,
  released_at TIMESTAMP,
  dispute_reason TEXT,
  dispute_evidence JSON,
  admin_notes TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Fraud Reports Table
Tracks fraud reports and investigations.

```sql
CREATE TABLE fraud_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  reported_user_id UUID NOT NULL REFERENCES users(id),
  fraud_type fraud_type NOT NULL,
  reason TEXT NOT NULL,
  evidence JSON,
  amount_involved DECIMAL(15,2),
  status fraud_report_status DEFAULT 'SUBMITTED',
  investigator_id UUID REFERENCES users(id),
  investigation_notes TEXT,
  resolution TEXT,
  resolved_at TIMESTAMP,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Digital Receipts Table
Stores immutable digital receipts with QR verification.

```sql
CREATE TABLE digital_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number VARCHAR UNIQUE NOT NULL,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  items JSON NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR DEFAULT 'KES',
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(15,2),
  qr_code TEXT NOT NULL,
  digital_signature TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  verification_url TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Payroll Tables
Manages bulk payroll processing.

```sql
CREATE TABLE payroll_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES users(id),
  batch_name VARCHAR NOT NULL,
  total_employees INTEGER NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  processed_employees INTEGER DEFAULT 0,
  failed_employees INTEGER DEFAULT 0,
  processed_amount DECIMAL(15,2) DEFAULT 0,
  status payroll_status DEFAULT 'UPLOADED',
  uploaded_file VARCHAR,
  failure_reason TEXT,
  validation_errors JSON,
  metadata JSON,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payroll_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES payroll_batches(id),
  employee_id UUID NOT NULL REFERENCES users(id),
  employee_name VARCHAR NOT NULL,
  national_id VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  gross_salary DECIMAL(15,2) NOT NULL,
  deductions JSON NOT NULL,
  total_deductions DECIMAL(15,2) NOT NULL,
  net_salary DECIMAL(15,2) NOT NULL,
  status payroll_entry_status DEFAULT 'PENDING',
  transaction_id UUID REFERENCES transactions(id),
  failure_reason TEXT,
  metadata JSON,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Enums

```sql
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'EMPLOYER', 'POLICE');
CREATE TYPE trust_status AS ENUM ('CLEAN', 'FLAGGED', 'BLACKLISTED');
CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'ESCROW_CREATE', 'ESCROW_RELEASE', 'ESCROW_REFUND', 'PAYROLL', 'FEE');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE payment_method AS ENUM ('MPESA', 'AIRTEL', 'BANK', 'WALLET');
CREATE TYPE escrow_status AS ENUM ('CREATED', 'FUNDED', 'CONFIRMED', 'RELEASED', 'DISPUTED', 'REFUNDED', 'EXPIRED');
CREATE TYPE fraud_type AS ENUM ('FAKE_GOODS', 'NON_DELIVERY', 'IDENTITY_THEFT', 'PAYMENT_FRAUD', 'PHISHING', 'OTHER');
CREATE TYPE fraud_report_status AS ENUM ('SUBMITTED', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');
CREATE TYPE payroll_status AS ENUM ('UPLOADED', 'VALIDATING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE payroll_entry_status AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
```

## Indexes

```sql
-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_national_id ON users(national_id);
CREATE INDEX idx_users_user_code ON users(user_code);
CREATE INDEX idx_users_trust_status ON users(trust_status);

-- Transaction indexes
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_from_wallet ON transactions(from_wallet_id);
CREATE INDEX idx_transactions_to_wallet ON transactions(to_wallet_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Escrow indexes
CREATE INDEX idx_escrow_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_seller_id ON escrow_transactions(seller_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);

-- Fraud report indexes
CREATE INDEX idx_fraud_reporter_id ON fraud_reports(reporter_id);
CREATE INDEX idx_fraud_reported_user_id ON fraud_reports(reported_user_id);
CREATE INDEX idx_fraud_status ON fraud_reports(status);

-- Receipt indexes
CREATE INDEX idx_receipts_receipt_number ON digital_receipts(receipt_number);
CREATE INDEX idx_receipts_transaction_id ON digital_receipts(transaction_id);
CREATE INDEX idx_receipts_seller_id ON digital_receipts(seller_id);
CREATE INDEX idx_receipts_buyer_id ON digital_receipts(buyer_id);

-- Payroll indexes
CREATE INDEX idx_payroll_batches_company_id ON payroll_batches(company_id);
CREATE INDEX idx_payroll_entries_batch_id ON payroll_entries(batch_id);
CREATE INDEX idx_payroll_entries_employee_id ON payroll_entries(employee_id);
```

## Key Features

1. **Immutable Transactions**: All transactions are append-only for audit purposes
2. **Trust Scoring**: Users have dynamic trust scores based on behavior
3. **KYC Integration**: National ID and KRA PIN validation
4. **Escrow System**: Secure buyer-seller transactions with dispute resolution
5. **Fraud Prevention**: Comprehensive fraud reporting and investigation
6. **Digital Receipts**: Tamper-proof receipts with QR verification
7. **Payroll Processing**: Bulk salary processing with automatic deductions
8. **Multi-currency Support**: Ready for multiple currencies (default KES)

## Security Considerations

1. **Data Encryption**: Sensitive data should be encrypted at rest and in transit
2. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds
3. **JWT Tokens**: Stateless authentication with configurable expiration
4. **Rate Limiting**: API endpoints should have rate limiting implemented
5. **Audit Logging**: All critical operations should be logged
6. **Data Privacy**: Personal data handling complies with data protection laws