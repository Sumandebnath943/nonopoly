// Indian-style money formatting.

const trim = (s) => s.replace(/\.?0+$/, '');

// ₹2,00,000 or ₹1.25 Cr
export function rupees(n = 0) {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(Math.round(n));
  if (a >= 1e7) return `${sign}₹${trim((a / 1e7).toFixed(2))} Cr`;
  return `${sign}₹${a.toLocaleString('en-IN')}`;
}

// ₹60K, ₹1.4L, ₹2.5Cr — for tight spaces
export function rupeesShort(n = 0) {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(Math.round(n));
  if (a >= 1e7) return `${sign}₹${trim((a / 1e7).toFixed(2))}Cr`;
  if (a >= 1e5) return `${sign}₹${trim((a / 1e5).toFixed(2))}L`;
  if (a >= 1e3) return `${sign}₹${trim((a / 1e3).toFixed(1))}K`;
  return `${sign}₹${a}`;
}
