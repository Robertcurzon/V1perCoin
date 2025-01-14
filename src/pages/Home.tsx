import React from 'react';
import { Shield, Coins, Lock, Skull, Flame, Target, Crosshair, FileText } from 'lucide-react';

export const Home: React.FC = () => {
  const viperInfo = {
    name: 'VIPER',
    marketCap: '10M',
    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYy11GDJmcp10Jx-jzgqnsrkRLS-95VTLunoOLL78uBSYHUoUH51u5FPeml2OXf3aDfMc&usqp=CAU'
  };

  const calculateProgress = (targetMarketCap: string): number => {
    const viperMC = 10; // $10M
    const targetMC = parseFloat(targetMarketCap.replace(/[BM]/g, ''));
    const multiplier = targetMarketCap.includes('B') ? 1000 : 1; // Convert billions to millions
    const progress = (viperMC / (targetMC * multiplier)) * 100;
    return Math.min(Math.round(progress * 100) / 100, 100); // Round to 2 decimal places and cap at 100%
  };

  const preyList = [
    { 
      name: 'Wen', 
      marketCap: '50M', 
      status: 'Hunting', 
      progress: calculateProgress('50M'),
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29175.png'
    },
    { 
      name: 'Shiro Neko', 
      marketCap: '100M', 
      status: 'Targeted', 
      progress: calculateProgress('100M'),
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/34378.png'
    },
    { 
      name: 'Ponke', 
      marketCap: '150M', 
      status: 'Stalking', 
      progress: calculateProgress('150M'),
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/29150.png'
    },
    { 
      name: 'Floki', 
      marketCap: '1.5B', 
      status: 'Tracked', 
      progress: calculateProgress('1.5B'),
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/10804.png'
    },
    {
      name: 'PEPE',
      marketCap: '7B',
      status: 'Tracked',
      progress: calculateProgress('7B'),
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/24478.png'
    },
    {
      name: 'SHIB',
      marketCap: '13B',
      status: 'Tracked',
      progress: calculateProgress('13B'),
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png'
    },
    { 
      name: 'DOGE', 
      marketCap: '52B', 
      status: 'Final Boss', 
      progress: calculateProgress('52B'),
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/74.png'
    },
  ];

  return (
    <div className="space-y-16">
      <section className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-6 mb-8">
          <div className="bg-black/50 p-4 rounded-xl flex items-center space-x-4">
            <img 
              src={viperInfo.icon} 
              alt="VIPER" 
              className="w-16 h-16 rounded-full ring-2 ring-green-500"
            />
            <div className="text-left">
              <h2 className="text-2xl font-bold text-green-500">{viperInfo.name}</h2>
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-green-400" />
                <span className="text-xl text-gray-300">Market Cap:</span>
                <span className="text-2xl font-bold text-green-400">${viperInfo.marketCap}</span>
              </div>
            </div>
          </div>
        </div>
        <h1 className="text-5xl font-bold text-green-500">
          VIPER: The Apex Predator of Crypto
        </h1>
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="text-xl text-gray-300">
            Let's be real - are you still playing with puppy coins and kitten tokens? Still chasing those childish memes while the real players make real moves? You're not a child, you're a grown-ass man/woman! It's time to stop the childish games and prey on the weak. Are you hungry for more?
          </p>
          <p className="text-xl text-green-400 font-semibold">
            VIPER isn't just another meme coin. It's a statement. A declaration that you're done with the playground and ready for the hunting grounds.
          </p>
          <div className="bg-black/50 p-6 rounded-xl space-y-4">
            <p className="text-lg text-gray-300">
              While they're posting cute animal emojis, we're deploying advanced privacy protocols. While they're making baby noises in their Telegram groups, we're building a predator-class ecosystem on SUI blockchain.
            </p>
            <p className="text-lg text-gray-300">
              No more kindergarten coins. No more nursery rhyme tokenomics. This is VIPER - where the hunters separate themselves from the prey.
            </p>
            <div className="text-xl font-bold text-green-500 pt-4">
              Pure. Raw. Power.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-black/50 p-8 rounded-xl">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-green-500 mb-4">Hunt Progress</h2>
            <p className="text-xl text-gray-300">
              Every predator needs a hunting ground. Watch as VIPER systematically dominates the meme coin ecosystem, 
              target by target. This isn't just a roadmap - it's a hit list.
            </p>
          </div>

          <div className="space-y-6">
            {preyList.map((prey, index) => (
              <div key={index} className="bg-gray-900/50 p-6 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-3">
                    {prey.icon ? (
                      <img src={prey.icon} alt={prey.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <Crosshair className={`h-6 w-6 ${
                        prey.progress > 10 ? 'text-red-500' :
                        prey.progress > 5 ? 'text-yellow-500' :
                        'text-green-500'
                      }`} />
                    )}
                    <h3 className="text-xl font-bold">{prey.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400">Market Cap: </span>
                    <span className="font-bold">${prey.marketCap}</span>
                  </div>
                </div>
                <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${
                      prey.progress > 10 ? 'bg-red-500' :
                      prey.progress > 5 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${prey.progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className={`text-sm font-semibold ${
                    prey.progress > 10 ? 'text-red-500' :
                    prey.progress > 5 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {prey.status}
                  </span>
                  <span className="text-sm text-gray-400">{prey.progress.toFixed(2)}% Complete</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gray-900/50 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-green-500 mb-4">The Hunt Strategy</h3>
            <div className="space-y-4 text-gray-300">
              <p>
                Each target represents a milestone in VIPER's ascension to apex status. We're not just taking market share - 
                we're systematically consuming the competition. Our advanced privacy features and predator-class ecosystem 
                give us the edge in every hunt.
              </p>
              <p>
                The progress bars above aren't just metrics - they're a real-time feast tracker. Watch as VIPER methodically 
                stalks, strikes, and devours each target, growing stronger with every kill. This is what happens when a real 
                predator enters the meme coin food chain.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};