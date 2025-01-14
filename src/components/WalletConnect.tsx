import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Wallet } from 'lucide-react';

export const WalletConnect: React.FC = () => {
  const { connected, address, connect, disconnect } = useWallet();

  return (
    <div>
      {!connected ? (
        <button
          onClick={() => connect()}
          className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Wallet className="h-5 w-5" />
          <span>Connect Wallet</span>
        </button>
      ) : (
        <button
          onClick={() => disconnect()}
          className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <span className="text-sm">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
        </button>
      )}
    </div>
  );
};