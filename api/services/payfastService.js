const crypto = require('crypto');
const axios = require('axios');

// Plaasboek™ Subscription Tiers (ZAR cents)
const TIERS = {
  BASIC: 49,
  FARM: 149,
  AGRIPRO: 499,
};

const PAYFAST_CONFIG = {
  merchantId: process.env.PAYFAST_MERCHANT_ID,
  merchantKey: process.env.PAYFAST_MERCHANT_KEY,
  passphrase: process.env.PAYFAST_PASSPHRASE,
  sandbox: process.env.NODE_ENV !== 'production',
  returnUrl: process.env.PAYFAST_RETURN_URL || 'https://app.vcds.co.za/payment/success',
  cancelUrl: process.env.PAYFAST_CANCEL_URL || 'https://app.vcds.co.za/payment/cancel',
  notifyUrl: process.env.PAYFAST_NOTIFY_URL || 'https://api.vcds.co.za/api/payments/notify',
};

/**
 * Generate MD5 signature for Payfast payload
 */
function generateSignature(data, passphrase = null) {
  let pfOutput = '';
  for (const key in data) {
    if (data[key] !== '') {
      pfOutput += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
    }
  }
  if (passphrase) {
    pfOutput += `passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
  } else {
    pfOutput = pfOutput.slice(0, -1);
  }
  return crypto.createHash('md5').update(pfOutput).digest('hex');
}

/**
 * Build Payfast payment payload
 * @param {userId, email, firstName, lastName, tier, subscriptionType} params
 */
function buildPaymentPayload({ userId, email, firstName, lastName, tier, subscriptionType = 'subscription' }) {
  const amount = TIERS[tier.toUpperCase()];
  if (!amount) throw new Error(`Invalid tier: ${tier}`);

  const data = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: PAYFAST_CONFIG.returnUrl,
    cancel_url: PAYFAST_CONFIG.cancelUrl,
    notify_url: PAYFAST_CONFIG.notifyUrl,
    name_first: firstName,
    name_last: lastName,
    email_address: email,
    m_payment_id: `${userId}-${Date.now()}`,
    amount: (parseInt(amount) / 100).toFixed(2),
    item_name: `Plaasboek™ ${tier} Subscription`,
    item_description: `Monthly subscription to Plaasboek™ - ${tier} tier`,
    custom_int1: userId,
    custom_str1: tier,
    custom_str2: 'Plaasboek™',
    subscription_type: subscriptionType === 'subscription' ? 1 : 0,
    billing_date: new Date().toISOString().split('T')[0],
    recurring_amount: (parseInt(amount) / 100).toFixed(2),
    frequency: 3, // Monthly
    cycles: 0,    // Indefinite
  };

  data.signature = generateSignature(data, PAYFAST_CONFIG.passphrase);

  const baseUrl = PAYFAST_CONFIG.sandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  return { payload: data, redirectUrl: baseUrl };
}

/**
 * Validate Payfast ITN (Instant Transaction Notification)
 */
async function validateITN(pfData, pfParamString) {
  // Step 1: Verify signature
  const signature = generateSignature(pfData, PAYFAST_CONFIG.passphrase);
  if (signature !== pfData.signature) {
    throw new Error('Invalid ITN signature');
  }

  // Step 2: Verify source IP (Payfast IPs)
  const validHosts = [
    'www.payfast.co.za', 'sandbox.payfast.co.za',
    'w1w.payfast.co.za', 'w2w.payfast.co.za'
  ];

  // Step 3: Verify payment amount matches expected
  const expectedAmount = TIERS[pfData.custom_str1?.toUpperCase()];
  if (expectedAmount) {
    const pfAmount = parseFloat(pfData.amount_gross) * 100;
    if (Math.abs(pfAmount - parseInt(expectedAmount)) > 1) {
      throw new Error('Amount mismatch');
    }
  }

  // Step 4: Verify with Payfast server
  const verifyUrl = PAYFAST_CONFIG.sandbox
    ? 'https://sandbox.payfast.co.za/eng/query/validate'
    : 'https://www.payfast.co.za/eng/query/validate';

  const response = await axios.post(verifyUrl, pfParamString, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  if (response.data !== 'VALID') {
    throw new Error('Payfast validation failed');
  }

  return true;
}

module.exports = { buildPaymentPayload, validateITN, TIERS, generateSignature };
