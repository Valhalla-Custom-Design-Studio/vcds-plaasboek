const crypto = require('crypto');
const axios = require('axios');

const TIERS = {
  BASIC: 4900,
  FARM: 14900,
  AGRIPRO: 49900,
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

function generateSignature(data, passphrase = null) {
  let pfOutput = '';
  for (const key in data) {
    if (data[key] !== '' && key !== 'signature') {
      pfOutput += `${key}=${encodeURIComponent(String(data[key])).replace(/%20/g, '+')}&`;
    }
  }
  if (passphrase) {
    pfOutput += `passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
  } else {
    pfOutput = pfOutput.slice(0, -1);
  }
  return crypto.createHash('md5').update(pfOutput).digest('hex');
}

function buildPaymentPayload({ userId, email, firstName, lastName, tier, subscriptionType = 'subscription' }) {
  const tierKey = tier.toUpperCase();
  const amount = TIERS[tierKey];
  if (amount === undefined) throw new Error(`Invalid tier: ${tier}. Valid: ${Object.keys(TIERS).join(', ')}`);
  if (parseInt(amount) === 0) return { free: true, tier: tierKey };

  const data = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: PAYFAST_CONFIG.returnUrl,
    cancel_url: PAYFAST_CONFIG.cancelUrl,
    notify_url: PAYFAST_CONFIG.notifyUrl,
    name_first: firstName || 'User',
    name_last: lastName || '',
    email_address: email,
    m_payment_id: `${userId}-${Date.now()}`,
    amount: (parseInt(amount) / 100).toFixed(2),
    item_name: `Plaasboek™ ${tierKey} Subscription`,
    item_description: `Monthly subscription - ${tierKey} tier`,
    custom_int1: userId,
    custom_str1: tierKey,
    custom_str2: 'vcds-plaasboek',
    subscription_type: 1,
    billing_date: new Date().toISOString().split('T')[0],
    recurring_amount: (parseInt(amount) / 100).toFixed(2),
    frequency: 3,
    cycles: 0,
  };

  data.signature = generateSignature(data, PAYFAST_CONFIG.passphrase);

  const baseUrl = PAYFAST_CONFIG.sandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  return { payload: data, redirectUrl: baseUrl };
}

async function validateITN(pfData, pfParamString) {
  const signature = generateSignature(pfData, PAYFAST_CONFIG.passphrase);
  if (signature !== pfData.signature) throw new Error('Invalid ITN signature');

  const verifyUrl = PAYFAST_CONFIG.sandbox
    ? 'https://sandbox.payfast.co.za/eng/query/validate'
    : 'https://www.payfast.co.za/eng/query/validate';

  const response = await axios.post(verifyUrl, pfParamString, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  if (response.data !== 'VALID') throw new Error('Payfast server validation failed');
  return true;
}

module.exports = { buildPaymentPayload, validateITN, TIERS, generateSignature };
