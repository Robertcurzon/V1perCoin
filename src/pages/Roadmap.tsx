import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

export const Roadmap: React.FC = () => {
  const phases = [
    {
      title: 'Phase 1: Launch',
      completed: true,
      items: [
        'Token Launch on SUI Blockchain',
        'Website Launch',
        'Community Building',
        'Initial Marketing Campaign',
      ],
    },
    {
      title: 'Phase 2: Core Features',
      completed: false,
      items: [
        'Staking Platform Launch',
        'Gaming Platform Beta',
        'Lottery System Implementation',
        'Partnership Announcements',
      ],
    },
    {
      title: 'Phase 3: Privacy Enhancement',
      completed: false,
      items: [
        'VIPER Privacy Wallet Development',
        'Transaction Privacy Tools',
        'Advanced Gaming Features',
        'Cross-chain Bridge Development',
      ],
    },
    {
      title: 'Phase 4: Expansion',
      completed: false,
      items: [
        'Mobile App Launch',
        'Additional Gaming Features',
        'DAO Implementation',
        'Major Exchange Listings',
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-green-500 mb-8">Roadmap</h1>
      
      <div className="space-y-8">
        {phases.map((phase, index) => (
          <div key={index} className="bg-gray-800 p-6 rounded-xl">
            <div className="flex items-center space-x-4 mb-4">
              {phase.completed ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Circle className="h-6 w-6 text-gray-500" />
              )}
              <h2 className="text-2xl font-bold">{phase.title}</h2>
            </div>
            <ul className="space-y-2 ml-10">
              {phase.items.map((item, itemIndex) => (
                <li key={itemIndex} className="text-gray-400">
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};