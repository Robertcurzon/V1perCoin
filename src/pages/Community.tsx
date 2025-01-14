import React from 'react';
import { Twitter, MessageCircle, Users, Share2, Trophy, Target, Upload, Crosshair, Palette, Medal } from 'lucide-react';

export const Community: React.FC = () => {
  const socialLinks = [
    {
      name: 'Twitter/X',
      icon: Twitter,
      link: 'https://x.com/ViperToken',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      description: 'Follow for alpha, updates, and predator memes',
    },
    {
      name: 'Telegram',
      icon: MessageCircle,
      link: 'https://t.me/ViperTokenOfficial',
      color: 'text-sky-400',
      bgColor: 'bg-sky-400/10',
      description: 'Join the elite hunting ground',
    },
  ];

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
        <h1 className="text-4xl font-bold text-green-500">The Viper Pit</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Welcome to the apex predator's den. No cute profile pics. No moon boys. Just pure dominance.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-800 p-6 rounded-xl hover:bg-gray-700 transition-colors group"
          >
            <div className={`${social.bgColor} p-4 inline-block rounded-lg mb-4`}>
              <social.icon className={`h-8 w-8 ${social.color}`} />
            </div>
            <h2 className="text-2xl font-bold mb-2">{social.name}</h2>
            <p className="text-gray-400 mb-4">{social.description}</p>
            <div className="flex items-center space-x-2 text-green-500">
              <span>Join Now</span>
              <Share2 className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        ))}
      </section>

      <section className="bg-black p-8 rounded-xl">
        <h2 className="text-2xl font-bold mb-6">Community Guidelines</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-green-500">The VIPER Way</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Focus on strategy, not hype</span>
              </li>
              <li className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Share intelligence, not emotions</span>
              </li>
              <li className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Build value, not noise</span>
              </li>
              <li className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Think like a predator, not prey</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-red-500">Not Welcome</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span>Moon boy mentality</span>
              </li>
              <li className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span>Cute animal profile pictures</span>
              </li>
              <li className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span>Rocket emoji spam</span>
              </li>
              <li className="flex items-center space-x-3">
                <Target className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span>Paper hands mentality</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-gray-800 p-8 rounded-xl">
          <Users className="h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Community Rewards</h2>
          <p className="text-gray-400 mb-6">
            Active hunters get rewarded. Contribute to the community, earn VIPER tokens, and climb the ranks.
          </p>
          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors">
            View Leaderboard
          </button>
        </div>
        <div className="bg-gray-800 p-8 rounded-xl">
          <Trophy className="h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold mb-4">Elite Programs</h2>
          <p className="text-gray-400 mb-6">
            Top contributors get access to exclusive benefits, early features, and direct communication with the team.
          </p>
          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors">
            Learn More
          </button>
        </div>
      </section>

      {/* Art Contest Section */}
      <section className="bg-black p-8 rounded-xl">
        <h2 className="text-3xl font-bold text-green-500 mb-8 text-center">Art Contest</h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto text-center mb-12">
          No more kindergarten art. Show us your elite design skills and claim your territory in the VIPER ecosystem.
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

        <div className="mt-12 bg-gray-800 p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-6">Marketing Arsenal</h2>
          <p className="text-gray-400 mb-8">
            Help spread the VIPER dominance with high-quality marketing materials.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {marketingPrizes.map((category) => (
              <div key={category.category} className="bg-gray-900 p-6 rounded-xl">
                <Palette className="h-8 w-8 text-green-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">{category.category}</h3>
                <p className="text-gray-400 mb-4">{category.description}</p>
                <p className="text-lg font-bold text-green-500 mb-4">{category.prize}</p>
                <button className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Submit Entry</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-6">Submission Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-green-500">Requirements</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center space-x-2">
                  <Crosshair className="h-5 w-5 text-green-500" />
                  <span>High resolution (minimum 3000x3000px for NFTs)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Crosshair className="h-5 w-5 text-green-500" />
                  <span>Original artwork only - no AI-generated content</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Crosshair className="h-5 w-5 text-green-500" />
                  <span>Must incorporate VIPER's predator theme</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Crosshair className="h-5 w-5 text-green-500" />
                  <span>Professional quality - no amateur submissions</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-green-500">Judging Criteria</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center space-x-2">
                  <Crosshair className="h-5 w-5 text-green-500" />
                  <span>Technical execution and attention to detail</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Crosshair className="h-5 w-5 text-green-500" />
                  <span>Creativity and originality</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Crosshair className="h-5 w-5 text-green-500" />
                  <span>Alignment with VIPER's premium brand identity</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Crosshair className="h-5 w-5 text-green-500" />
                  <span>Viral potential for marketing materials</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};