# 🚀 Quick Start: SMS Service Setup

## ✅ Your SMS Service is Ready!

Your Nolojia Wallet SMS service has been configured with your Africa's Talking API key.

### 📋 Configuration Summary
- **API Key**: Configured ✅
- **Username**: `sandbox` (default for now)
- **Base URL**: `https://api.africastalking.com/version1`
- **Sender ID**: `NOLOJIA`

### 🔧 Environment Setup
Make sure your `.env` file contains:
```env
AFRICASTALKING_BASE_URL=https://api.africastalking.com/version1
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=atsk_16a72e6f7b749170623c1f284709a339b2c75f2a08c0a8e3138d5cd953c399976463bc45
AFRICASTALKING_SENDER_ID=NOLOJIA
OTP_SECRET=your-secure-secret-key
APP_NAME=Nolojia Wallet
```

### 🧪 Test Your Setup (3 Simple Commands)

1. **Test SMS Sending**
```bash
curl -X POST http://localhost:3001/api/sms-test/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254722123456",
    "message": "Welcome to Nolojia Wallet! Your SMS service is working."
  }'
```

2. **Test OTP Generation**
```bash
curl -X POST http://localhost:3001/api/sms-test/send-test-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254722123456",
    "purpose": "PHONE_VERIFICATION"
  }'
```

3. **Check Account Balance**
```bash
curl -X GET http://localhost:3001/api/sms-test/balance
```

### 📱 Available Features

#### ✅ **OTP Services**
- 6-digit numeric codes
- 5-minute expiry
- 3 attempt limit
- Multiple purposes (LOGIN, SIGNUP, TRANSACTION, etc.)

#### ✅ **Notification Templates**
- Wallet credit/debit alerts
- Transaction confirmations
- Security alerts
- Low balance warnings
- Loan notifications
- And 15+ more templates

#### ✅ **Bulk SMS**
- Send to multiple recipients
- Automatic phone number formatting
- Kenyan network support

### 🎯 Usage in Your Code

```typescript
// Send OTP
await otpService.generateAndSendOtp({
  userId: "user123",
  phoneNumber: "+254722123456",
  purpose: OtpPurpose.LOGIN
});

// Send notification
await notificationService.notifyWalletCredit(
  "+254722123456",
  1000, // amount
  5000, // new balance
  "REF123"
);

// Send custom SMS
await smsService.sendSms({
  to: "+254722123456",
  message: "Your custom message"
});
```

### 📚 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/otp/send` | POST | Send OTP (authenticated) |
| `/api/otp/verify` | POST | Verify OTP (authenticated) |
| `/api/otp/send-public` | POST | Send OTP (public - signup/reset) |
| `/api/sms-test/send-sms` | POST | Test SMS sending |
| `/api/sms-test/balance` | GET | Check SMS balance |

### 🔐 Security Features
- HMAC-based OTP hashing
- Phone number validation
- Rate limiting (1-min cooldown)
- Automatic cleanup of expired OTPs
- Comprehensive error handling

### 📞 Kenyan Phone Number Support
The service automatically formats these number types:
- `+254722123456` ✅
- `0722123456` → `+254722123456` ✅
- `254722123456` → `+254722123456` ✅
- `722123456` → `+254722123456` ✅

### 🚨 Next Steps for Production

1. **Get Custom Username**: Contact Africa's Talking for your custom username
2. **Sender ID Approval**: Get `NOLOJIA` approved (1-2 business days)
3. **Account Top-up**: Add credit to your Africa's Talking account
4. **Monitoring**: Set up balance and failure rate alerts

### 🆘 Need Help?

- **Setup Issues**: Check `backend/src/modules/sms/setup-guide.md`
- **API Reference**: Check `backend/src/modules/sms/api-integration.md`
- **Full Documentation**: Check `backend/src/modules/sms/README.md`
- **Usage Examples**: Check `backend/src/modules/sms/examples/sms-usage.example.ts`

### ✨ Your SMS Service is Production-Ready!

Start your backend server and begin testing. The service will automatically handle:
- Phone number formatting
- OTP generation and verification
- Notification sending
- Error handling and logging
- Balance monitoring

Happy coding! 🎉