export const paymentConfig = {
  // Razorpay API credentials
  keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag', // Default test key or from env
  keySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_default',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_secret_crm_2026',
  currency: 'INR',
  companyName: 'Pixbe CRM & TeleSales',
  plans: {
    'starter-monthly': { name: 'Starter License (Monthly)', amount: 2499, seats: 3 },
    'pro-monthly': { name: 'Pro Agency License (Monthly)', amount: 4999, seats: 10 },
    'enterprise-annual': { name: 'Enterprise License (Annual)', amount: 49999, seats: 50 },
  }
};
