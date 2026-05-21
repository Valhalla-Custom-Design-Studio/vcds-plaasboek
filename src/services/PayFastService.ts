import crypto from 'crypto';
import axios from 'axios';

const PAYFAST_CONFIG = {
  merchantId: process.env.PAYFAST_MERCHANT_ID!,
  merchantKey: process.env.PAYFAST_MERCHANT_KEY!,
  passphrase: process.env.PAYFAST_PASSPHRASE!,
  returnUrl: process.env.PAYFAST_RETURN_URL!,
  cancelUrl: process.env.PAYFAST_CANCEL_URL!,
  notifyUrl: process.env.PAYFAST_NOTIFY_URL!,
  sandbox: process.env.NODE_ENV !== 'production',
};
const PAYFAST_HOST = PAYFAST_CONFIG.sandbox
  ? 'https://sandbox.payfast.co.za' : 'https://www.payfast.co.za';

export interface PayFastPaymentData {
  amount: number; itemName: string; itemDescription?: string;
  email: string; firstName: string; lastName: string;
  subscriptionType?: 1 | 2; billingDate?: string;
  recurringAmount?: number; frequency?: 3 | 4 | 5 | 6;
  cycles?: number; customStr1?: string; customStr2?: string;
}

export const generateSignature = (data: Record<string, string>, passphrase: string): string => {
  const sorted = Object.keys(data).sort()
    .filter(k => k !== 'signature' && data[k] !== '')
    .map(k => `${k}=${encodeURIComponent(data[k]).replace(/%20/g, '+')}`)
    .join('&');
  const withPass = passphrase ? `${sorted}&passphrase=${encodeURIComponent(passphrase)}` : sorted;
  return crypto.createHash('md5').update(withPass).digest('hex');
};

export const buildPaymentUrl = (paymentData: PayFastPaymentData): string => {
  const data: Record<string, string> = {
    merchant_id: PAYFAST_CONFIG.merchantId, merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: PAYFAST_CONFIG.returnUrl, cancel_url: PAYFAST_CONFIG.cancelUrl,
    notify_url: PAYFAST_CONFIG.notifyUrl, name_first: paymentData.firstName,
    name_last: paymentData.lastName, email_address: paymentData.email,
    amount: paymentData.amount.toFixed(2), item_name: paymentData.itemName,
    ...(paymentData.itemDescription && { item_description: paymentData.itemDescription }),
    ...(paymentData.subscriptionType && { subscription_type: String(paymentData.subscriptionType) }),
    ...(paymentData.billingDate && { billing_date: paymentData.billingDate }),
    ...(paymentData.recurringAmount && { recurring_amount: paymentData.recurringAmount.toFixed(2) }),
    ...(paymentData.frequency && { frequency: String(paymentData.frequency) }),
    ...(paymentData.cycles !== undefined && { cycles: String(paymentData.cycles) }),
    ...(paymentData.customStr1 && { custom_str1: paymentData.customStr1 }),
    ...(paymentData.customStr2 && { custom_str2: paymentData.customStr2 }),
  };
  data.signature = generateSignature(data, PAYFAST_CONFIG.passphrase);
  return `${PAYFAST_HOST}/eng/process?${new URLSearchParams(data).toString()}`;
};

export const validateITN = async (itnData: Record<string, string>): Promise<boolean> => {
  const { signature, ...dataWithoutSig } = itnData;
  if (signature !== generateSignature(dataWithoutSig, PAYFAST_CONFIG.passphrase)) return false;
  try {
    const paramString = Object.entries(dataWithoutSig)
      .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, '+')}`)
      .join('&');
    const response = await axios.post(`${PAYFAST_HOST}/eng/query/validate`, paramString,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    return response.data === 'VALID';
  } catch { return false; }
};
