import React from 'react';
import { Gamepad2, Construction } from 'lucide-react';

export const Games: React.FC = () => {
  const inProgress = true;
  const games = [
    {
      title: 'Snake Game',
      description: 'Classic snake game with a crypto twist. Earn VIPER tokens as you grow!',
      entryFee: '10 VIPER',
      maxPrize: '1000 VIPER',
    },
    {
      title: 'Crypto Slots',
      description: 'Spin to win! Match crypto symbols to earn VIPER tokens.',
      entryFee: '50 VIPER',
      maxPrize: '5000 VIPER',
    },
    {
      title: 'Price Prediction',
      description: 'Predict VIPER price movements and win big!',
      entryFee: '100 VIPER',
      maxPrize: '10000 VIPER',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-end items-center space-x-4 bg-gray-800/50 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <Construction className="h-5 w-5 text-yellow-500 animate-pulse" />
          <span className="text-yellow-500 font-semibold">In Development</span>
        </div>
        <h1 className="text-4xl font-bold text-green-500">Games</h1>
      </div>
      
      <div className={`grid md:grid-cols-3 gap-8 ${inProgress ? 'opacity-75 select-none' : ''}`}>
        {games.map((game, index) => (
          <div key={index} className="bg-gray-800 p-6 rounded-xl">
            <Gamepad2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">{game.title}</h3>
            <p className="text-gray-400 mb-4">{game.description}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Entry Fee: <span className="text-white">{game.entryFee}</span></p>
              <p className="text-sm text-gray-400">Max Prize: <span className="text-white">{game.maxPrize}</span></p>
            </div>
            <button 
              className="mt-4 w-full bg-green-500/50 text-white px-4 py-2 rounded-lg cursor-not-allowed"
              disabled={inProgress}
            >
              Play Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};