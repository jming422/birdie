const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function formatUsd(x: number) {
  return USD_FORMAT.format(x);
}
