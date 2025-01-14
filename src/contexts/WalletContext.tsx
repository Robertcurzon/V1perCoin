import React, { createContext, useContext } from 'react';
import { useWalletKit } from '@mysten/wallet-kit';

interface WalletContextType {
  connected: boolean;
  address: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  address: '',
  connect: async () => {},
  disconnect: async () => {},
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentAccount, isConnected, connect, disconnect } = useWalletKit();

  const walletState = {
    connected: isConnected,
    address: currentAccount?.address || '',
    connect: async () => {
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    },
    disconnect: async () => {
      try {
        await disconnect();
      } catch (error) {
        console.error('Failed to disconnect wallet:', error);
      }
    },
  };

  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
};