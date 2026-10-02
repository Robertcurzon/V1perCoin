import { createDAppKit } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import launch from './launch.json';
const network = launch.network === 'mainnet' ? 'mainnet' : 'testnet';
export const dAppKit = createDAppKit({
  networks: [network],
  createClient: (network) => new SuiGrpcClient({ network, baseUrl: `https://fullnode.${network}.sui.io:443` }),
});
declare module '@mysten/dapp-kit-react' { interface Register { dAppKit: typeof dAppKit; } }
