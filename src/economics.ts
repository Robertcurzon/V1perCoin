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
  return principal * ratePpm(months) * BigInt(months) / (12n * UNIT);
}
export function exitPreview(principal: bigint, reserved: bigint, duration: bigint, elapsed: bigint) {
  const time = elapsed < 0n ? 0n : elapsed > duration ? duration : elapsed;
  if (duration <= 0n || duration % MONTH_MS !== 0n) throw new Error("Invalid lock duration.");
  const completed = Number(time / MONTH_MS);
  const calculated = completed === 0 ? 0n : netReward(principal, completed);
  const earned = calculated > reserved ? reserved : calculated;
  const fee = principal * (500n * (duration - time)) / (10_000n * duration);
  const burn = fee * 50n / 100n;
  const founder = fee / 10n;
  return { earned, fee, burn, founder, community: fee - burn - founder, net: principal - fee + earned };
}

export function fullReward(principal: bigint, months: number): bigint {
  return netReward(principal, months);
}
