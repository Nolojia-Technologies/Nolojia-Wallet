# 📧 Email Verification & Password Reset System

## Overview
Complete implementation of user registration with email verification, login with verification checks, and secure password reset functionality for Nolojia Wallet.

## 🚀 Features Implemented

### ✅ 1. User Registration with Email Verification
- **Registration**: Users provide full name, email, phone, and password
- **Security**: Passwords hashed with bcrypt (14 salt rounds)
- **Verification**: Unique tokens generated with 24-hour expiry
- **Email**: Automatic verification email sent with secure link
- **Database**: Email verification status tracked

### ✅ 2. Email Verification Endpoints
- **Token Validation**: Secure token verification with expiry checks
- **Status Updates**: Automatic user verification status updates
- **Welcome Email**: Sent after successful verification
- **Error Handling**: Comprehensive error responses

### ✅ 3. Secure Login System
- **Verification Check**: Only verified users can log in
- **Account Locking**: Failed attempt tracking and lockout
- **Session Management**: JWT tokens with refresh capabilities
- **Security Logging**: Comprehensive audit trail

### ✅ 4. Password Reset System
- **Secure Tokens**: 30-minute expiry for reset links
- **Email Delivery**: Professional reset email templates
- **Validation**: Strong password requirements enforced
- **Confirmation**: Password change confirmation emails

### ✅ 5. Security Best Practices
- **Rate Limiting**: Prevents brute force attacks
- **Token Security**: Cryptographically secure random tokens
- **Password Strength**: Enforced complexity requirements
- **Audit Logging**: All actions logged for security monitoring

## 📊 Database Schema Changes

### New Entity: `email_verifications`
```sql
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  type ENUM('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'PHONE_VERIFICATION'),
  isUsed BOOLEAN DEFAULT false,
  expiresAt TIMESTAMP NOT NULL,
  usedAt TIMESTAMP NULL,
  ipAddress INET NULL,
  userAgent TEXT NULL,
  metadata JSONB NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Updated Entity: `users`
```sql
-- New verification fields added
ALTER TABLE users ADD COLUMN isEmailVerified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN emailVerifiedAt TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN isPhoneVerified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN phoneVerifiedAt TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN isKycVerified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN kycVerifiedAt TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN loginAttempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN lockedUntil TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN lastPasswordReset TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN twoFactorEnabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN twoFactorSecret VARCHAR(100) NULL;
```

## 🔗 API Endpoints

### Registration & Verification
```http
# Register new user
POST /api/auth/register
Content-Type: application/json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+254722123456",
  "password": "SecurePass123!",
  "accountType": "PERSONAL"
}

# Verify email (POST)
POST /api/auth/verify-email
Content-Type: application/json
{
  "token": "verification_token_here"
}

# Verify email (GET - for email links)
GET /api/auth/verify-email?token=verification_token_here

# Resend verification email
POST /api/auth/resend-verification
Content-Type: application/json
{
  "email": "john@example.com",
  "type": "EMAIL_VERIFICATION"
}
```

### Authentication
```http
# Login (only for verified users)
POST /api/auth/login
Content-Type: application/json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

# Get verification status
GET /api/auth/verification-status
Authorization: Bearer <jwt_token>
```

### Password Reset
```http
# Request password reset
POST /api/auth/request-password-reset
Content-Type: application/json
{
  "email": "john@example.com"
}

# Validate reset token
POST /api/auth/validate-reset-token
Content-Type: application/json
{
  "token": "reset_token_here"
}

# Reset password
POST /api/auth/reset-password
Content-Type: application/json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

## 📧 Email Templates

### 1. Verification Email
- **Subject**: Welcome to Nolojia Wallet - Verify Your Email
- **Content**: Professional welcome with verification button
- **Expiry**: 24 hours
- **Link**: `https://your-frontend.com/verify-email?token=xxx`

### 2. Password Reset Email
- **Subject**: Nolojia Wallet - Password Reset Request
- **Content**: Security-focused reset instructions
- **Expiry**: 30 minutes
- **Link**: `https://your-frontend.com/reset-password?token=xxx`

### 3. Welcome Email
- **Subject**: Welcome to Nolojia Wallet!
- **Content**: Feature overview and getting started guide
- **Triggered**: After successful email verification

### 4. Password Changed Email
- **Subject**: Nolojia Wallet - Password Changed Successfully
- **Content**: Security confirmation with contact info
- **Triggered**: After successful password reset

## ⚙️ Environment Configuration

```env
# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
SMTP_FROM=Nolojia Wallet <noreply@nolojia.com>

# Application URLs
FRONTEND_URL=http://localhost:3000
APP_NAME=Nolojia Wallet

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d
```

## 🔒 Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Security
- Cryptographically secure random generation
- Unique tokens per request
- Automatic expiry and cleanup
- Single-use tokens (marked as used)

### Rate Limiting
- Email verification: 5-minute cooldown between requests
- Password reset: Standard rate limiting applied
- Login attempts: Account lockout after 5 failed attempts

### Account Security
- Email verification required for login
- Failed login attempt tracking
- Account lockout with time-based release
- Audit logging for all security events

## 🧪 Testing the Implementation

### 1. Test User Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+254722123456",
    "password": "TestPass123!",
    "accountType": "PERSONAL"
  }'
```

### 2. Test Email Verification
```bash
# Check your email for verification link, then:
curl -X POST http://localhost:3001/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token": "your_token_here"}'
```

### 3. Test Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### 4. Test Password Reset
```bash
# Request reset
curl -X POST http://localhost:3001/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Reset password (after receiving email)
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token_here",
    "newPassword": "NewPass123!",
    "confirmPassword": "NewPass123!"
  }'
```

## 🔧 Setup Instructions

### 1. Run Database Migrations
```bash
# Run the new migrations
npm run migration:run
```

### 2. Configure Email Service
Update your `.env` file with SMTP credentials:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password for Gmail
```

### 3. Update Frontend URLs
Set your frontend URL for email links:
```env
FRONTEND_URL=https://your-domain.com
```

### 4. Test Email Delivery
```bash
# Test email service health
curl http://localhost:3001/api/auth/health
```

## 📱 Frontend Integration

### Email Verification Page
```typescript
// Handle verification from email link
const token = new URLSearchParams(window.location.search).get('token');
if (token) {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  const result = await response.json();
  // Handle success/error
}
```

### Password Reset Flow
```typescript
// Step 1: Request reset
const requestReset = async (email: string) => {
  const response = await fetch('/api/auth/request-password-reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
};

// Step 2: Reset password
const resetPassword = async (token: string, newPassword: string) => {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      newPassword,
      confirmPassword: newPassword
    })
  });
  return response.json();
};
```

## 🚨 Error Handling

### Common Error Responses
```javascript
// Invalid/expired token
{
  "success": false,
  "message": "Invalid or expired verification token",
  "statusCode": 401
}

// Email already verified
{
  "success": false,
  "message": "Email is already verified",
  "statusCode": 400
}

// Rate limiting
{
  "success": false,
  "message": "Please wait 300 seconds before requesting another verification email",
  "statusCode": 400
}

// Password requirements
{
  "success": false,
  "message": "Password must contain at least one uppercase letter",
  "statusCode": 400
}
```

## 🎯 Next Steps

### Ready for SMS OTP Integration
- ✅ Phone number field already in user registration
- ✅ SMS service already implemented
- 🔄 Future: Add SMS OTP for login and high-risk transactions

### Future Enhancements
- Two-factor authentication setup
- Email template customization
- Webhook notifications for external systems
- Advanced fraud detection integration

Your email verification and password reset system is now fully functional and production-ready! 🚀