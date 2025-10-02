# SMS Service Module Documentation

## Overview
This module provides comprehensive SMS functionality for the Nolojia Wallet application using Africa's Talking API. It includes OTP generation/verification, transaction notifications, and various alert systems.

## Features
- 🔐 **OTP Management**: Generate and verify 6-digit OTPs with expiry and attempt limits
- 📱 **SMS Notifications**: Send transaction alerts, balance updates, and security notifications
- 🔄 **Bulk SMS**: Send messages to multiple recipients simultaneously
- 🛡️ **Security**: Hash-based OTP storage, rate limiting, and automatic cleanup
- 📊 **Balance Monitoring**: Check SMS credit balance
- 🇰🇪 **Africa's Talking HTTP API**: Direct API integration for reliable SMS delivery
- ⚡ **HTTP Client**: Uses Axios for robust API calls with timeout and error handling

## Configuration

### Environment Variables
Add these to your `.env` file:

```env
# Africa's Talking HTTP API Configuration
AFRICASTALKING_BASE_URL=https://api.africastalking.com/version1
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_SENDER_ID=NOLOJIA

# For sandbox testing (optional)
# AFRICASTALKING_BASE_URL=https://api.sandbox.africastalking.com/version1

# OTP Configuration
OTP_SECRET=your-secure-otp-hashing-secret
APP_NAME=Nolojia Wallet

# Notification Settings
MINIMUM_BALANCE_THRESHOLD=100
```

## API Endpoints

### OTP Endpoints

#### Send OTP (Authenticated)
```http
POST /api/otp/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+254722123456",
  "purpose": "TRANSACTION",
  "metadata": {
    "amount": 50000
  }
}
```

#### Verify OTP (Authenticated)
```http
POST /api/otp/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+254722123456",
  "otp": "123456",
  "purpose": "TRANSACTION"
}
```

#### Send OTP (Public - for signup/password reset)
```http
POST /api/otp/send-public
Content-Type: application/json

{
  "phoneNumber": "+254722123456",
  "purpose": "SIGNUP"
}
```

#### Get OTP History (Authenticated)
```http
GET /api/otp/history
Authorization: Bearer <token>
```

## Usage Examples

### 1. Inject Services into Your Module

```typescript
import { Module } from '@nestjs/common';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [SmsModule],
  // ... other configuration
})
export class YourModule {}
```

### 2. Use in Your Service

```typescript
import { Injectable } from '@nestjs/common';
import { OtpService, NotificationService } from '../sms';
import { OtpPurpose } from '../sms/entities/otp.entity';

@Injectable()
export class YourService {
  constructor(
    private readonly otpService: OtpService,
    private readonly notificationService: NotificationService,
  ) {}

  async sendLoginOtp(userId: string, phoneNumber: string) {
    return await this.otpService.generateAndSendOtp({
      userId,
      phoneNumber,
      purpose: OtpPurpose.LOGIN,
    });
  }

  async notifyTransaction(phoneNumber: string, amount: number, recipient: string) {
    return await this.notificationService.notifyTransactionSuccess(
      phoneNumber,
      amount,
      recipient,
      'TXN123456',
    );
  }
}
```

## OTP Purpose Types

```typescript
enum OtpPurpose {
  LOGIN = 'LOGIN',                       // User login verification
  SIGNUP = 'SIGNUP',                     // New user registration
  TRANSACTION = 'TRANSACTION',           // High-value transactions
  PASSWORD_RESET = 'PASSWORD_RESET',     // Password recovery
  PHONE_VERIFICATION = 'PHONE_VERIFICATION', // Phone number verification
  TWO_FACTOR = 'TWO_FACTOR',            // 2FA authentication
}
```

## Notification Types

The notification service supports various pre-configured message templates:

- `WALLET_CREDIT`: Wallet top-up notifications
- `WALLET_DEBIT`: Wallet deduction notifications
- `TRANSACTION_SUCCESS`: Successful transaction alerts
- `TRANSACTION_FAILED`: Failed transaction alerts
- `LOW_BALANCE`: Balance threshold warnings
- `PAYMENT_REQUEST`: Payment request notifications
- `ACCOUNT_SECURITY`: Security-related alerts
- `KYC_APPROVED/REJECTED`: KYC status updates
- `LOAN_APPROVED/DISBURSED`: Loan-related notifications
- And many more...

## Security Features

### OTP Security
- **6-digit numeric codes**: Cryptographically secure generation
- **5-minute expiry**: Automatic invalidation after timeout
- **3 attempt limit**: Prevents brute force attacks
- **HMAC hashing**: OTPs stored as hashes, not plain text
- **Rate limiting**: 1-minute cooldown between OTP requests
- **Automatic cleanup**: Expired OTPs removed hourly

### Phone Number Validation
```typescript
// The service automatically formats Kenyan numbers
"+254722123456"   // Valid
"0722123456"      // Will be formatted to +254722123456
"254722123456"    // Will be formatted to +254722123456
"722123456"       // Will be formatted to +254722123456
```

## Error Handling

The services include comprehensive error handling:

```typescript
try {
  const result = await otpService.generateAndSendOtp(data);
  if (result.success) {
    // OTP sent successfully
  }
} catch (error) {
  if (error instanceof BadRequestException) {
    // Handle rate limiting or validation errors
  } else if (error instanceof UnauthorizedException) {
    // Handle authentication errors
  }
}
```

## Database Schema

### OTP Entity
```typescript
{
  id: uuid,
  userId: string,
  phoneNumber: string,
  otp: string (hashed),
  purpose: OtpPurpose,
  isUsed: boolean,
  attempts: number,
  expiresAt: Date,
  verifiedAt: Date?,
  metadata: JSON?,
  createdAt: Date
}
```

## Testing

### Send Test OTP
```bash
curl -X POST http://localhost:3001/api/otp/send-public \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254722123456",
    "purpose": "SIGNUP"
  }'
```

### Check SMS Balance
```typescript
const balance = await smsService.getBalance();
console.log(`Balance: ${balance.balance} ${balance.currency}`);
```

## Production Considerations

1. **API Keys Security**: Never commit API keys to version control
2. **Rate Limiting**: Implement additional rate limiting at the API Gateway level
3. **Monitoring**: Set up alerts for low SMS balance
4. **Logging**: Monitor failed SMS deliveries and OTP verification failures
5. **Backup Provider**: Consider implementing a fallback SMS provider
6. **Cost Management**: Monitor SMS usage to control costs
7. **Phone Number Validation**: Kenyan-specific validation implemented
8. **Message Queuing**: For high-volume scenarios, implement a message queue

## Troubleshooting

### Common Issues

1. **SMS not sending**
   - Check Africa's Talking credentials
   - Verify phone number format
   - Check SMS balance

2. **OTP verification failing**
   - Ensure OTP hasn't expired (5-minute window)
   - Check attempt count (max 3 attempts)
   - Verify correct purpose parameter

3. **Rate limiting errors**
   - Wait 1 minute between OTP requests
   - Implement exponential backoff for retries

## Support

For Africa's Talking support:
- Documentation: https://developers.africastalking.com/
- Dashboard: https://account.africastalking.com/

## License

This module is part of the Nolojia Wallet application and follows the main project's license.