export type SourceChain = 'ethereum' | 'solana' | 'dogecoin' | 'memecore';
export const networks: Record<SourceChain, {label: string; chainId: string | null; explorer: string}>;
export function addressValid(chain: string, address: string, receiving?: boolean): boolean;
export function normalizeAddress(chain: string, address: string, receiving?: boolean): string;
export function assetKey(chain: string, contract: string): string;
export function bindingMessage(source: string, sui: string, chain: SourceChain, windowStart: number, bindingDeadline?: number): string;
export function lockMessage(message: string, months: number): string;
export function suiLockMessage(sui: string, months: number, windowStart: number, bindingDeadline?: number): string;
