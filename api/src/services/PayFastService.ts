import crypto from 'crypto';

interface PayFastPaymentOptions {
  amount: number;
  itemName: string;
  itemDescription?: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionType?: number;
  frequency?: number;
  cycles?: number;
  customStr1?: string;
  customStr2?: string;
}

export function buildPaymentUrl(opts: PayFastPaymentOptions): string {
  const sandbox = process.env.PAYFAST_SANDBOX === 'true';
  const baseUrl = sandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  const params: Record<string, string> = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID!,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
    return_url: `${process.env.APP_ORIGIN}/payment/success`,
    cancel_url: `${process.env.APP_ORIGIN}/payment/cancel`,
    notify_url: `${process.env.API_URL}/payments/itn`,
    name_first: opts.firstName,
    name_last: opts.lastName,
    email_address: opts.email,
    amount: opts.amount.toFixed(2),
    item_name: opts.itemName,
    ...(opts.itemDescription && { item_description: opts.itemDescription }),
    ...(opts.subscriptionType && { subscription_type: String(opts.subscriptionType) }),
    ...(opts.frequency && { frequency: String(opts.frequency) }),
    ...(opts.cycles !== undefined && { cycles: String(opts.cycles) }),
    ...(opts.customStr1 && { custom_str1: opts.customStr1 }),
    ...(opts.customStr2 && { custom_str2: opts.customStr2 }),
  };

  const passphrase = process.env.PAYFAST_PASSPHRASE;
  const paramString = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
    .join('&');
  const signString = passphrase
    ? `${paramString}&passphrase=${encodeURIComponent(passphrase.trim())}`
    : paramString;
  const signature = crypto.createHash('md5').update(signString).digest('hex');

  return `${baseUrl}?${paramString}&signature=${signature}`;
}

export async function validateITN(data: Record<string, string>): Promise<boolean> {
  try {
    const { signature, ...rest } = data;
    const passphrase = process.env.PAYFAST_PASSPHRASE;
    const paramString = Object.entries(rest)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v).trim())}`)
      .join('&');
    const signString = passphrase
      ? `${paramString}&passphrase=${encodeURIComponent(passphrase.trim())}`
      : paramString;
    const computed = crypto.createHash('md5').update(signString).digest('hex');
    return computed === signature;
  } catch {
    return false;
  }
}
