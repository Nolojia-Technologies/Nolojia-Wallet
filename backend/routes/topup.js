const express = require('express');
const router = express.Router();

// Mock payment gateway integrations
const paymentGateways = {
  mpesa: {
    initiate: async (phoneNumber, amount) => {
      // Simulate M-Pesa STK push
      return {
        success: true,
        transactionId: `MPESA${Date.now()}`,
        checkoutRequestId: `CHK${Date.now()}`,
        message: 'M-Pesa prompt sent to phone'
      };
    },
    verify: async (transactionId) => {
      // Simulate verification
      return {
        success: true,
        status: 'COMPLETED',
        amount: 0,
        reference: transactionId
      };
    }
  },

  card: {
    createSession: async (amount, currency = 'KES') => {
      // Simulate card payment session
      return {
        success: true,
        sessionId: `CARD${Date.now()}`,
        paymentUrl: `https://pay.nolojia.com/checkout/${Date.now()}`,
        expiresIn: 3600
      };
    }
  },

  bank: {
    generateDetails: async (userId, amount) => {
      // Generate bank transfer details
      return {
        success: true,
        accountName: 'Nolojia Wallet Ltd',
        accountNumber: '0123456789',
        bankName: 'Kenya Commercial Bank',
        branchCode: '091',
        swiftCode: 'KCBLKENX',
        reference: `NLJ${userId}${Date.now().toString().slice(-6)}`,
        amount: amount,
        currency: 'KES'
      };
    }
  },

  crypto: {
    generateAddresses: async () => {
      // Generate crypto wallet addresses
      return {
        success: true,
        addresses: {
          bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          ethereum: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2',
          usdt: {
            trc20: 'TN4rKxNqVmtYknQdNzsJdN1z3GQvWPWWxp',
            erc20: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2'
          }
        },
        exchangeRates: {
          BTC_KES: 5800000,
          ETH_KES: 380000,
          USDT_KES: 155
        }
      };
    }
  },

  paypal: {
    createOrder: async (amount, currency = 'USD') => {
      // Create PayPal order
      const kesAmount = amount;
      const usdAmount = (kesAmount / 155).toFixed(2); // Approximate exchange rate

      return {
        success: true,
        orderId: `PAYPAL${Date.now()}`,
        approveUrl: `https://paypal.com/checkout/${Date.now()}`,
        amount: usdAmount,
        currency: 'USD',
        originalAmount: kesAmount,
        originalCurrency: 'KES'
      };
    }
  },

  ussd: {
    generateCode: async (userId, amount) => {
      // Generate USSD session
      return {
        success: true,
        ussdCode: '*234*1*1#',
        sessionId: `USSD${Date.now()}`,
        reference: `${userId}${Date.now().toString().slice(-8)}`,
        instructions: [
          'Dial *234*1*1# on your phone',
          'Select option 1 for Wallet Top-up',
          `Enter reference: ${userId}`,
          `Enter amount: ${amount}`,
          'Enter your PIN to confirm'
        ]
      };
    }
  }
};

// Initiate top-up transaction
router.post('/initiate', async (req, res) => {
  try {
    const { method, amount, phoneNumber, userId } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Calculate fees (1.5% transaction fee)
    const fee = amount * 0.015;
    const totalAmount = amount + fee;

    let paymentDetails = {};

    switch (method) {
      case 'mpesa':
        if (!phoneNumber) {
          return res.status(400).json({
            success: false,
            message: 'Phone number required for M-Pesa'
          });
        }
        paymentDetails = await paymentGateways.mpesa.initiate(phoneNumber, totalAmount);
        break;

      case 'card':
        paymentDetails = await paymentGateways.card.createSession(totalAmount);
        break;

      case 'bank':
        paymentDetails = await paymentGateways.bank.generateDetails(userId || 'DEMO', totalAmount);
        break;

      case 'crypto':
        paymentDetails = await paymentGateways.crypto.generateAddresses();
        break;

      case 'paypal':
        paymentDetails = await paymentGateways.paypal.createOrder(totalAmount);
        break;

      case 'ussd':
        paymentDetails = await paymentGateways.ussd.generateCode(userId || 'DEMO', totalAmount);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method'
        });
    }

    // Store transaction in database (mock)
    const transaction = {
      id: `TXN${Date.now()}`,
      userId: userId || 'DEMO',
      method,
      amount,
      fee,
      totalAmount,
      status: 'PENDING',
      paymentDetails,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      transaction,
      paymentDetails
    });

  } catch (error) {
    console.error('Top-up initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate top-up'
    });
  }
});

// Verify transaction status
router.get('/verify/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Mock verification - in production, check with actual payment gateways
    const mockStatus = Math.random() > 0.3 ? 'COMPLETED' : 'PENDING';

    res.json({
      success: true,
      transactionId,
      status: mockStatus,
      amount: 10000, // Mock amount
      completedAt: mockStatus === 'COMPLETED' ? new Date().toISOString() : null
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify transaction'
    });
  }
});

// Get top-up history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Mock transaction history
    const history = [
      {
        id: 'TXN001',
        method: 'mpesa',
        amount: 5000,
        fee: 75,
        totalAmount: 5075,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 86300000).toISOString()
      },
      {
        id: 'TXN002',
        method: 'card',
        amount: 10000,
        fee: 150,
        totalAmount: 10150,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        completedAt: new Date(Date.now() - 172700000).toISOString()
      },
      {
        id: 'TXN003',
        method: 'bank',
        amount: 25000,
        fee: 375,
        totalAmount: 25375,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: null
      }
    ];

    res.json({
      success: true,
      transactions: history
    });

  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top-up history'
    });
  }
});

// Cancel pending transaction
router.post('/cancel/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Mock cancellation - in production, implement actual cancellation logic
    res.json({
      success: true,
      message: 'Transaction cancelled successfully',
      transactionId
    });

  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel transaction'
    });
  }
});

// Webhook endpoints for payment providers
router.post('/webhook/mpesa', async (req, res) => {
  // Handle M-Pesa callback
  console.log('M-Pesa webhook:', req.body);
  res.json({ success: true });
});

router.post('/webhook/card', async (req, res) => {
  // Handle card payment callback
  console.log('Card webhook:', req.body);
  res.json({ success: true });
});

router.post('/webhook/paypal', async (req, res) => {
  // Handle PayPal IPN
  console.log('PayPal webhook:', req.body);
  res.json({ success: true });
});

module.exports = router;