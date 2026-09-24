export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
}

export function formatBOB(amount: number): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0).replace('BOB', 'Bs.');
}

export function formatNumber(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount || 0);
}

export function formatPercent(rate: number): string {
  return `${(rate || 0).toFixed(1)}%`;
}
