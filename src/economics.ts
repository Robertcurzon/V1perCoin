import rates from './rewardSchedule.json';
export const MONTH_MS = 2_592_000_000n;
export const UNIT = 1_000_000n;
export function ratePpm(months: number): bigint {
  if (!Number.isInteger(months) || months < 1 || months > 24) throw new Error('Choose 1–24 whole months.');
  return BigInt(rates[months - 1]);
}
export function parseAmount(text: string): bigint {
  if (!/^\d+(\.\d{1,6})?$/.test(text)) throw new Error('Enter V1PR with at most six decimal places.');
  const [whole, fraction = ''] = text.split('.');
  const value = BigInt(whole) * UNIT + BigInt(fraction.padEnd(6, '0'));
  if (value <= 0n || value > 18_446_744_073_709_551_615n) throw new Error('Amount must be positive and fit the coin balance.');
  return value;
}
export function formatAmount(amount: bigint): string {
  if (amount < 0n) return `-${formatAmount(-amount)}`;
  const fraction = (amount % UNIT).toString().padStart(6, '0').replace(/0+$/, '');
  return `${(amount / UNIT).toLocaleString('en-US')}${fraction ? `.${fraction}` : ''}`;
}
export function netReward(principal: bigint, months: number): bigint {
  return principal * ratePpm(months) / UNIT;
}
export function exitPreview(principal: bigint, reserved: bigint, duration: bigint, elapsed: bigint) {
  const time = elapsed < 0n ? 0n : elapsed > duration ? duration : elapsed;
  const earned = reserved * time / duration;
  const fee = principal * (30n * duration + 170n * (duration - time)) / (10_000n * duration);
  const burn = fee * 20n / 100n;
  const founder = fee / 10n;
  return { earned, fee, burn, founder, community: fee - burn - founder, net: principal - fee + earned };
}

export function fullReward(principal: bigint, months: number): bigint {
  return principal * 30n / 10_000n + netReward(principal, months);
}
