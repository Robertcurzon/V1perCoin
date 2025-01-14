import React from 'react';
import { Trophy, Medal, Palette, Upload, Crosshair } from 'lucide-react';

export const ArtContest: React.FC = () => {
  const currentTarget = {
    name: 'Wen',
    marketCap: '50M',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29175.png'
  };

  const preyNFTTiers = [
    {
      tier: 'Gold',
      prize: '50,000 VIPER',
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500',
    },
    {
      tier: 'Silver',
      prize: '25,000 VIPER',
      icon: Medal,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/20',
      borderColor: 'border-gray-400',
    },
    {
      tier: 'Bronze',
      prize: '10,000 VIPER',
      icon: Medal,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500',
    },
  ];

  const marketingPrizes = [
    {
      category: 'Viral Meme',
      prize: '5,000 VIPER',
      description: 'Create memes that showcase VIPER devouring other memecoins',
    },
    {
      category: 'Community Art',
      prize: '3,000 VIPER',
      description: 'Original artwork celebrating VIPER victories and milestones',
    },
    {
      category: 'Social Media Kit',
      prize: '2,000 VIPER',
      description: 'Design banners, avatars, and social media assets',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-green-500">VIPER Art Contest</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          No more kindergarten art. Show us your elite design skills and claim your territory in the VIPER ecosystem.
        </p>
      </section>

      {/* Current Target Section */}
      <section className="bg-gradient-to-r from-gray-900 to-black p-8 rounded-xl border border-green-500/20">
        <div className="flex items-center space-x-4 mb-6">
          <img src={currentTarget.icon} alt={currentTarget.name} className="w-16 h-16 rounded-full ring-2 ring-green-500" />
          <div>
            <h2 className="text-2xl font-bold text-green-500">Current Target: {currentTarget.name}</h2>
            <p className="text-gray-400">Market Cap: ${currentTarget.marketCap}</p>
          </div>
        </div>
        <div className="bg-black/50 p-6 rounded-lg">
          <h3 className="text-xl font-bold text-green-500 mb-4">Special Focus</h3>
          <p className="text-gray-300">
            Our current art campaign is focused on showcasing VIPER's dominance over {currentTarget.name}. Create artwork that depicts
            the inevitable: a predator consuming its prey. Show the world what happens when VIPER strikes.
          </p>
          <div className="mt-6 flex justify-end">
            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Submit {currentTarget.name} Artwork</span>
            </button>
          </div>
        </div>
      </section>

      <section className="bg-black p-8 rounded-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Prey NFT Collection</h2>
        <p className="text-gray-400 text-center mb-8">
          Three exclusive NFTs will be minted for each conquered prey. Submit your designs and become part of VIPER history.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {preyNFTTiers.map((tier) => (
            <div key={tier.tier} className={`bg-gray-900 p-6 rounded-xl border ${tier.borderColor}`}>
              <div className={`${tier.bgColor} p-4 rounded-lg mb-4 flex items-center justify-center`}>
                <tier.icon className={`h-12 w-12 ${tier.color}`} />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${tier.color}`}>{tier.tier}</h3>
              <p className="text-gray-400 mb-4">Prize Pool:</p>
              <p className="text-2xl font-bold text-green-500 mb-4">{tier.prize}</p>
              <button className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Submit Design</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Rest of the sections remain unchanged */}
      {/* ... */}
    </div>
  );
};