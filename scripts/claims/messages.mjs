const DAY_MS=86400000;
export function entryUrl(value) {
  const url=new URL(value);
  if(url.protocol!=='https:' || url.username || url.password || url.hash)throw Error('Use a public HTTPS entry link without credentials or fragment');
  return url.toString();
}
export function applicationMessage(address,startMs,entry) {
  if(!/^0x[a-f0-9]{64}$/.test(address)||BigInt(address)===0n||!Number.isSafeInteger(startMs)||startMs<7*DAY_MS)throw Error('Invalid application address or scheduled opening');
  return `Apply ${address} for the V1PR free claim\nOpening: ${startMs}\nCommunity entry: ${entryUrl(entry)}`;
}
