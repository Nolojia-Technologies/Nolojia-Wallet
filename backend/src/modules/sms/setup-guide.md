# Africa's Talking Setup Guide for Nolojia Wallet

## Your Current Configuration

✅ **API Key**: `atsk_16a72e6f7b749170623c1f284709a339b2c75f2a08c0a8e3138d5cd953c399976463bc45`
⚠️ **Username**: Using `sandbox` (default) - no custom username yet
📱 **Sender ID**: `NOLOJIA`

## Quick Setup Steps

### 1. Environment Configuration
Your `.env` file should contain:
```env
AFRICASTALKING_BASE_URL=https://api.africastalking.com/version1
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=atsk_16a72e6f7b749170623c1f284709a339b2c75f2a08c0a8e3138d5cd953c399976463bc45
AFRICASTALKING_SENDER_ID=NOLOJIA
```

### 2. Test Your Setup
Start your application and test the SMS service:

```bash
# Test SMS sending
curl -X POST http://localhost:3001/api/sms-test/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254722123456",
    "message": "Hello from Nolojia Wallet! This is a test message."
  }'
```

```bash
# Check account balance
curl -X GET http://localhost:3001/api/sms-test/balance
```

```bash
# Test OTP generation
curl -X POST http://localhost:3001/api/sms-test/send-test-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254722123456",
    "purpose": "PHONE_VERIFICATION"
  }'
```

## Next Steps for Production

### 1. Get Your Custom Username
Contact Africa's Talking support to:
- Get your custom username (e.g., `nolojia` or `nolojia_wallet`)
- This will be required for production use
- Update the `AFRICASTALKING_USERNAME` environment variable

### 2. Sender ID Approval
- Request approval for your sender ID `NOLOJIA`
- This may take 1-2 business days
- Approved sender IDs have better delivery rates

### 3. Account Verification
- Complete KYC verification with Africa's Talking
- Required for production SMS sending
- Ensures compliance with Kenyan regulations

## Expected Responses

### Successful SMS Send
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "success": true,
    "messageId": "ATXid_sample123",
    "cost": "KES 1.0000",
    "recipients": [
      {
        "statusCode": 101,
        "number": "+254722123456",
        "status": "Success",
        "cost": "KES 1.0000",
        "messageId": "ATXid_sample123"
      }
    ]
  }
}
```

### Balance Check
```json
{
  "success": true,
  "data": {
    "balance": "KES 1000.0000",
    "currency": "KSH"
  }
}
```

### OTP Generation
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "testUserId": "test_1640995200000",
  "expiresAt": "2023-12-31T12:05:00.000Z",
  "attemptsRemaining": 3
}
```

## Troubleshooting

### Common Issues

1. **"SMS service not configured"**
   - Check that your API key is correctly set in environment variables
   - Restart your application after updating `.env`

2. **"Invalid API Key"**
   - Verify the API key in your Africa's Talking dashboard
   - Ensure no extra spaces or characters

3. **"Insufficient Balance"**
   - Top up your Africa's Talking account
   - Check balance using the test endpoint

4. **"Invalid Phone Number"**
   - Ensure Kenyan format: +254XXXXXXXXX
   - Use test numbers for development: +254711XXXXX

## Sandbox vs Production

### Sandbox Mode (Current)
- ✅ Free testing
- ✅ No real SMS sent (test numbers only)
- ✅ API validation
- ❌ Limited to test phone numbers

### Production Mode (Future)
- ✅ Real SMS delivery
- ✅ All Kenyan networks
- ✅ Custom sender ID
- 💰 Charges apply (~KSH 1 per SMS)

## Cost Information

### SMS Pricing (Kenya)
- **Local SMS**: ~KSH 0.80 - 1.20 per message
- **Bulk rates**: Lower rates for high volume
- **OTP messages**: Same as regular SMS
- **Delivery reports**: Usually included

### Account Top-up
- Minimum top-up: Usually KSH 100
- Payment methods: M-Pesa, Bank transfer
- Auto-recharge: Available for production accounts

## Security Best Practices

1. **API Key Protection**
   - Never commit API keys to version control
   - Use environment variables only
   - Rotate keys periodically

2. **Rate Limiting**
   - Built-in 1-minute cooldown for OTPs
   - Monitor daily/monthly usage
   - Set up balance alerts

3. **Phone Number Validation**
   - All numbers validated before sending
   - Kenyan network prefixes verified
   - Invalid numbers rejected

## Support Contacts

- **Africa's Talking Support**: support@africastalking.com
- **Account Dashboard**: https://account.africastalking.com/
- **Developer Docs**: https://developers.africastalking.com/
- **Status Page**: https://status.africastalking.com/

## Monitoring Setup

### Recommended Alerts
1. **Low Balance**: Alert when balance < KSH 500
2. **High Failure Rate**: Alert when failures > 10%
3. **API Errors**: Alert on HTTP 5xx errors
4. **Unusual Volume**: Alert on unexpected SMS spikes

### Log Monitoring
```typescript
// Check logs for these patterns
"SMS sent successfully"     // Successful delivery
"SMS sending failed"        // Delivery failure
"Failed to send SMS"        // API error
"Insufficient balance"      // Low balance warning
```

Your SMS service is now configured and ready for testing! 🚀