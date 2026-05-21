export const formatZAR = (amount: number, inCents = false): string => {
  const value = inCents ? amount / 100 : amount;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency', currency: 'ZAR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value);
};
export const formatZARRange = (min: number, max: number, period = 'month'): string =>
  `${formatZAR(min)} – ${formatZAR(max)}/${period}`;
export const formatZARAccessible = (amount: number): string =>
  `${amount.toFixed(2)} rand`;
