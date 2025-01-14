import React from 'react';
import { Coins, Lock, Construction } from 'lucide-react';

export const Stake: React.FC = () => {
  const inProgress = true;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end items-center space-x-4 bg-gray-800/50 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <Construction className="h-5 w-5 text-yellow-500 animate-pulse" />
          <span className="text-yellow-500 font-semibold">In Development</span>
        </div>
        <h1 className="text-4xl font-bold text-green-500">Stake VIPER</h1>
      </div>
      
      <div className={`relative ${inProgress ? 'opacity-75 select-none' : ''}`}>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4">Your Staking Stats</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400">Available Balance</p>
                <p className="text-2xl font-bold">0 VIPER</p>
              </div>
              <div>
                <p className="text-gray-400">Staked Amount</p>
                <p className="text-2xl font-bold">0 VIPER</p>
              </div>
              <div>
                <p className="text-gray-400">Rewards Earned</p>
                <p className="text-2xl font-bold">0 VIPER</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-2xl font-bold mb-4">Stake Tokens</h2>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Enter amount to stake"
                className="w-full p-3 rounded-lg bg-gray-700 text-white cursor-not-allowed"
                disabled={inProgress}
              />
              <button 
                className="w-full flex items-center justify-center space-x-2 bg-green-500/50 text-white px-4 py-3 rounded-lg cursor-not-allowed"
                disabled={inProgress}
              >
                <Coins className="h-5 w-5" />
                <span>Stake VIPER</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};