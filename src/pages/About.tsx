import React from 'react';
import { Palette, Brush, Crown, FileText, Shield, Lock, Cpu, Coins, Target, Zap, Network, Users, Code, Database, Key, CheckCircle, Circle } from 'lucide-react';

export const About: React.FC = () => {
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
    <div className="max-w-6xl mx-auto space-y-16">
      {/* About Section */}
      <section>
        <h1 className="text-4xl font-bold text-green-500 mb-8">About VIPER</h1>
        
        <section>
          <h2 className="text-2xl font-bold mb-4">The Apex Manifesto</h2>
          <p className="text-gray-400">
            In a sea of cute, cuddly meme coins, VIPER emerges as the apex predator. We're not here to play nice - we're here to dominate. Built on the SUI blockchain, we combine lethal privacy features with raw trading power.
          </p>
        </section>

        <section className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-xl mt-8">
          <h2 className="text-2xl font-bold mb-6">Premium Brand Identity</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Palette className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Sophisticated Design</h3>
              <p className="text-gray-400">While they scribble with crayons, we craft with precision. Every visual element reflects our premium status.</p>
            </div>
            <div className="text-center">
              <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Luxury Aesthetics</h3>
              <p className="text-gray-400">No more MS Paint artwork. VIPER brings high-end design to the meme coin space.</p>
            </div>
            <div className="text-center">
              <Brush className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Professional Branding</h3>
              <p className="text-gray-400">Every asset crafted by elite designers. No amateur hour here.</p>
            </div>
          </div>
        </section>
      </section>

      {/* Roadmap Section */}
      <section className="bg-gray-900 p-8 rounded-xl">
        <h2 className="text-3xl font-bold text-green-500 mb-8">Strategic Roadmap</h2>
        
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
      </section>

      {/* Whitepaper Section */}
      <section className="bg-gray-900 p-8 rounded-xl">
        <div className="bg-white rounded-xl p-8">
          <div className="flex items-center space-x-4 border-b border-gray-200 pb-6 mb-8">
            <FileText className="h-12 w-12 text-green-600" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Technical Whitepaper</h2>
              <p className="text-gray-600">Technical Specification v1.0</p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Abstract</h3>
            <p className="text-gray-700">
              This technical whitepaper presents VIPER, a privacy-focused cryptocurrency built on the SUI blockchain. 
              We introduce novel approaches to transaction privacy, gaming mechanics, and community governance, 
              leveraging advanced cryptographic primitives and blockchain technology.
            </p>
          </div>
        </div>

        <div className="space-y-8 mt-8">
          {/* Technical Architecture */}
          <div className="bg-white rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">1. Technical Architecture</h3>
            
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="text-xl font-bold text-gray-900 mb-3">1.1 Core Protocol Stack</h4>
                <div className="space-y-4 text-gray-700">
                  <p>The VIPER protocol implements a layered architecture:</p>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{`
Layer 4: Application Layer
- Gaming Interfaces
- Staking Mechanisms
- Lottery Systems
- NFT Marketplace

Layer 3: Privacy Layer
- Zero-Knowledge Circuits
- Ring Signature Implementation
- Stealth Address Generator
- Commitment Schemes

Layer 2: Core Protocol
- Transaction Processing
- State Management
- Smart Contract Engine
- Consensus Interface

Layer 1: SUI Blockchain
- Move VM Execution
- Consensus Mechanism
- Network Layer
- Storage Layer
                    `}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Protocol */}
          <div className="bg-white rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">2. Privacy Protocol</h3>
            
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="text-xl font-bold text-gray-900 mb-3">2.1 Transaction Privacy</h4>
                <div className="space-y-4 text-gray-700">
                  <p>Transaction privacy is achieved through:</p>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{`
protocol TransactionFlow {
    // One-time stealth addresses
    function generateStealthAddress(
        scan_pubkey: Point,
        spend_pubkey: Point
    ) -> StealthAddress {
        r = random_scalar()
        R = G * r
        shared_secret = H(r * scan_pubkey)
        payment_address = spend_pubkey + H(shared_secret) * G
        return StealthAddress { R, payment_address }
    }
}
                    `}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Contracts */}
          <div className="bg-white rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">3. Smart Contract Architecture</h3>
            
            <div className="space-y-6">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="text-xl font-bold text-gray-900 mb-3">3.1 Core Contracts</h4>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>{`
module viper::core {
    struct TokenConfig has key {
        total_supply: u64,
        decimals: u8,
        privacy_enabled: bool
    }

    struct StakingPool has key {
        total_staked: u64,
        reward_rate: u64,
        minimum_stake: u64
    }
}
                  `}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};