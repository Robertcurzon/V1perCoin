import React from 'react';
import { Ticket, Construction } from 'lucide-react';

export const Lottery: React.FC = () => {
  const inProgress = true;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end items-center space-x-4 bg-gray-800/50 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <Construction className="h-5 w-5 text-yellow-500 animate-pulse" />
          <span className="text-yellow-500 font-semibold">In Development</span>
        </div>
        <h1 className="text-4xl font-bold text-green-500">VIPER Lottery</h1>
      </div>
      
      <div className={`relative ${inProgress ? 'opacity-75 select-none' : ''}`}>
        <div className="bg-gray-800 p-6 rounded-xl">
          <div className="flex items-center space-x-4 mb-6">
            <Ticket className="h-8 w-8 text-green-500" />
            <div>
              <h2 className="text-2xl font-bold">Current Prize Pool</h2>
              <p className="text-3xl font-bold text-green-500">100,000 VIPER</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-400">Time Remaining</p>
              <p className="text-2xl font-bold">23:45:12</p>
            </div>
            <div>
              <p className="text-gray-400">Tickets Sold</p>
              <p className="text-2xl font-bold">1,234</p>
            </div>
            <div>
              <p className="text-gray-400">Your Tickets</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl mt-6">
          <h2 className="text-2xl font-bold mb-4">Buy Tickets</h2>
          <div className="space-y-4">
            <input
              type="number"
              placeholder="Enter number of tickets"
              className="w-full p-3 rounded-lg bg-gray-700 text-white cursor-not-allowed"
              disabled={inProgress}
            />
            <p className="text-gray-400">Price per ticket: 100 VIPER</p>
            <button 
              className="w-full flex items-center justify-center space-x-2 bg-green-500/50 text-white px-4 py-3 rounded-lg cursor-not-allowed"
              disabled={inProgress}
            >
              <Ticket className="h-5 w-5" />
              <span>Buy Tickets</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};