# Africa's Talking API Integration Guide

## Overview
The SMS service now uses direct HTTP API calls to Africa's Talking instead of their SDK. This provides more control and transparency over the API interactions.

## API Endpoints Used

### 1. Send SMS
**Endpoint**: `POST https://api.africastalking.com/version1/messaging`

**Headers**:
```
apiKey: your_api_key
Content-Type: application/x-www-form-urlencoded
Accept: application/json
```

**Payload** (URL-encoded):
```
username=your_username
to=+254722123456,+254711987654
message=Your message here
from=NOLOJIA
enqueue=1
```

**Response**:
```json
{
  "SMSMessageData": {
    "Message": "Sent to 2/2 Total Cost: KES 2.0000",
    "Recipients": [
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

### 2. Check Account Balance
**Endpoint**: `GET https://api.africastalking.com/version1/user?username=your_username`

**Headers**:
```
apiKey: your_api_key
Accept: application/json
```

**Response**:
```json
{
  "UserData": {
    "balance": "KES 1000.0000"
  }
}
```

## Status Codes

### SMS Status Codes
- `101`: Success - Message sent successfully
- `102`: Queued - Message queued for delivery
- `401`: Risk hold - Message held due to risk analysis
- `402`: Invalid sender ID
- `403`: Invalid phone number
- `404`: Unsupported number type
- `405`: Insufficient balance
- `406`: User in blacklist
- `407`: Could not route message
- `500`: Internal server error
- `501`: Gateway error
- `502`: Rejected by gateway

## Environment Configuration

```env
# Production
AFRICASTALKING_BASE_URL=https://api.africastalking.com/version1
AFRICASTALKING_USERNAME=your_production_username
AFRICASTALKING_API_KEY=your_production_api_key

# Sandbox (for testing)
AFRICASTALKING_BASE_URL=https://api.sandbox.africastalking.com/version1
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=your_sandbox_api_key
```

## Phone Number Formats

### Supported Formats (automatically converted):
- `+254722123456` (international)
- `0722123456` (local with leading zero)
- `254722123456` (country code without +)
- `722123456` (mobile number only)

### Kenyan Mobile Networks:
- **Safaricom**: 07xx series (e.g., 0722, 0723, 0724, 0727, 0728, 0729)
- **Airtel**: 01xx series (e.g., 0100, 0101, 0102, 0103)
- **Telkom**: 077x series (e.g., 0770, 0771, 0772)

## Error Handling

The service handles various error scenarios:

1. **Network Errors**: Timeout, connection issues
2. **API Errors**: Invalid credentials, insufficient balance
3. **Validation Errors**: Invalid phone numbers, empty messages
4. **Rate Limiting**: Built-in retry mechanism

## Testing Your Integration

### 1. Test SMS Sending
```bash
curl -X POST http://localhost:3001/api/sms-test/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254722123456",
    "message": "Test message from Nolojia Wallet"
  }'
```

### 2. Test OTP Generation
```bash
curl -X POST http://localhost:3001/api/sms-test/send-test-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254722123456",
    "purpose": "PHONE_VERIFICATION"
  }'
```

### 3. Check Balance
```bash
curl -X GET http://localhost:3001/api/sms-test/balance
```

## Migration from SDK

### What Changed:
1. ✅ **Removed**: `africastalking` npm package dependency
2. ✅ **Added**: `axios` for HTTP requests
3. ✅ **Updated**: Direct API calls with proper error handling
4. ✅ **Enhanced**: Better logging and response handling
5. ✅ **Added**: Timeout configuration (30s for SMS, 15s for balance)

### Benefits:
- **Transparency**: Full control over API requests/responses
- **Debugging**: Easier to debug API issues
- **Flexibility**: Can easily switch to other SMS providers
- **Security**: Better credential management
- **Monitoring**: Enhanced logging and error tracking

## Bulk SMS Support

The service supports sending to multiple recipients:

```typescript
await smsService.sendSms({
  to: ['+254722123456', '+254711987654', '+254733456789'],
  message: 'Bulk notification message'
});
```

## Security Best Practices

1. **API Key Protection**: Store in environment variables only
2. **Rate Limiting**: Built-in cooldown between requests
3. **Input Validation**: All phone numbers validated before sending
4. **Error Logging**: Comprehensive logging without exposing sensitive data
5. **Timeout Protection**: Prevents hanging requests

## Monitoring & Alerts

### Key Metrics to Monitor:
- SMS delivery success rate
- API response times
- Account balance
- Failed delivery reasons
- Daily/monthly usage

### Recommended Alerts:
- Balance below threshold (e.g., KSH 500)
- High failure rate (>10%)
- API errors or timeouts
- Unusual SMS volume

## Troubleshooting

### Common Issues:

1. **"Invalid API Key"**
   - Check `AFRICASTALKING_API_KEY` in environment
   - Verify API key in Africa's Talking dashboard

2. **"Insufficient Balance"**
   - Check account balance: `GET /api/sms-test/balance`
   - Top up your Africa's Talking account

3. **"Invalid Phone Number"**
   - Ensure Kenyan format: +254XXXXXXXXX
   - Check network prefix (07xx for Safaricom, etc.)

4. **"Message Not Delivered"**
   - Check recipient phone is active
   - Verify network coverage
   - Check for DND (Do Not Disturb) settings

## Support Resources

- **Africa's Talking API Docs**: https://developers.africastalking.com/
- **Account Dashboard**: https://account.africastalking.com/
- **Status Codes Reference**: https://developers.africastalking.com/docs/sms/overview
- **Support**: support@africastalking.com