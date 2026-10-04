import { fromBase58 } from '@mysten/sui/utils';
import { getBytes, sha256 } from 'ethers';
export const networks = {
  ethereum: { label: 'Ethereum', chainId: '0x1', explorer: 'https://etherscan.io/address/' },
  solana: { label: 'Solana', chainId: null, explorer: 'https://solscan.io/account/' },
  dogecoin: { label: 'Dogecoin', chainId: null, explorer: 'https://dogechain.info/address/' },
  memecore: { label: 'MemeCore', chainId: '0x1100', explorer: 'https://memecorescan.io/address/' },
};
export function addressValid(chain, address, receiving = false) {
  if (typeof address !== 'string') return false;
  if (chain === 'ethereum' || chain === 'memecore') return /^0x[0-9a-fA-F]{40}$/.test(address) && BigInt(address) !== 0n;
  try {
    const bytes = fromBase58(address);
    if (chain === 'solana') return bytes.length === 32 && bytes.some(n => n !== 0);
    if (chain !== 'dogecoin' || bytes.length !== 25 || !(bytes[0] === 30 || (receiving && bytes[0] === 22))) return false;
    const checksum = getBytes(sha256(sha256(bytes.slice(0,21))));
    return bytes.slice(21).every((n,i) => n === checksum[i]);
  } catch { return false; }
}
export function normalizeAddress(chain, address, receiving = false) {
  if (!addressValid(chain,address,receiving)) throw new Error('Unsupported chain or invalid address');
  return chain === 'ethereum' || chain === 'memecore' ? address.toLowerCase() : address;
}
export function assetKey(chain, contract) {
  if (contract === 'native' && (chain === 'dogecoin' || chain === 'memecore')) return `${chain}:native`;
  if (chain === 'dogecoin' || chain === 'memecore') throw new Error('Only the native asset is accepted on this network');
  return `${chain}:${normalizeAddress(chain,contract)}`;
}
export function bindingMessage(source, sui, chain, windowStart, bindingDeadline = windowStart + 23 * 86400) {
  if (!networks[chain] || !Number.isSafeInteger(windowStart) || windowStart <= 0) throw new Error('Invalid binding network or campaign start');
  return `Bind ${source} to Sui ${sui} for the V1PER Feast\nSource network: ${chain}\nCampaign start: ${windowStart}\nBinding deadline: ${bindingDeadline}`;
}
export function lockMessage(message, months) { return `${message}\nLock choice: ${months} months`; }

export function suiLockMessage(sui, months, windowStart, bindingDeadline = windowStart + 23 * 86400) {
  return `V1PER Feast Sui allocation choice\nSui wallet: ${sui.toLowerCase()}\nCampaign start: ${windowStart}\nBinding deadline: ${bindingDeadline}\nLock choice: ${months} months`;
}
export function transactionHash(chain, value) {
  if (typeof value !== 'string') throw Error('Invalid transaction hash');
  const canonical = chain === 'solana' ? value : value.toLowerCase();
  if ((chain === 'ethereum' || chain === 'memecore') && /^0x[0-9a-f]{64}$/.test(canonical)) return canonical;
  if (chain === 'dogecoin' && /^[0-9a-f]{64}$/.test(canonical)) return canonical;
  if (chain === 'solana' && /^[1-9A-HJ-NP-Za-km-z]{64,88}$/.test(canonical) && fromBase58(canonical).length === 64) return canonical;
  throw Error('Invalid network transaction hash');
}
