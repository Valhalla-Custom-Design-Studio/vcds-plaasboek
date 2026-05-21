const { buildPaymentPayload, generateSignature, TIERS } = require('../../api/services/payfastService');

process.env.PAYFAST_MERCHANT_ID = 'test_merchant';
process.env.PAYFAST_MERCHANT_KEY = 'test_key';
process.env.PAYFAST_PASSPHRASE = 'test_passphrase';
process.env.NODE_ENV = 'test';

describe('Plaasboek™ Payfast Service', () => {
  test('TIERS are defined', () => {
    expect(Object.keys(TIERS).length).toBeGreaterThan(0);
  });

  test('buildPaymentPayload returns payload and redirectUrl', () => {
    const tier = Object.keys(TIERS)[0];
    const result = buildPaymentPayload({
      userId: 'user123',
      email: 'test@vcds.co.za',
      firstName: 'Test',
      lastName: 'User',
      tier,
    });
    expect(result.payload).toBeDefined();
    expect(result.redirectUrl).toContain('payfast');
    expect(result.payload.signature).toBeDefined();
  });

  test('generateSignature produces consistent hash', () => {
    const data = { merchant_id: '123', amount: '99.00' };
    const sig1 = generateSignature(data, 'passphrase');
    const sig2 = generateSignature(data, 'passphrase');
    expect(sig1).toBe(sig2);
  });
});
