import { useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [minting, setMinting] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState(null);

  const creatures = [
    {
      name: 'Pyro Phoenix',
      element: 'fire',
      description: 'Born from volcanic ashes, masters offensive strategies',
      stats: { attack: 80, defense: 40, speed: 60, intelligence: 50 },
      color: 'from-orange-500 to-red-600',
      emoji: ''
    },
    {
      name: 'Aqua Serpent',
      element: 'water',
      description: 'Ancient sea guardian, excels in balanced combat',
      stats: { attack: 60, defense: 60, speed: 50, intelligence: 60 },
      color: 'from-blue-500 to-cyan-600',
      emoji: ''
    },
    {
      name: 'Terra Golem',
      element: 'earth',
      description: 'Mountain defender, specializes in defensive tactics',
      stats: { attack: 40, defense: 80, speed: 30, intelligence: 70 },
      color: 'from-green-500 to-emerald-600',
      emoji: ''
    }
  ];

  const handleMint = async (creature) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setMinting(true);
    setSelectedCreature(creature.name);

    try {
      // Demo mode - simulate minting
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Register creature in backend
      const response = await fetch('http://localhost:5000/api/creatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...creature,
          owner: address,
          level: 1,
          evolutionStage: 'Base'
        })
      });

      if (response.ok) {
        toast.success('Creature minted successfully! (Demo Mode)');
      } else {
        throw new Error('Failed to register creature');
      }
    } catch (error) {
      toast.error('Minting failed. Please try again.');
      console.error('Minting error:', error);
    } finally {
      setMinting(false);
      setSelectedCreature(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      {isConnected && <Navbar />}
      
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            AI-Driven NFTs That <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Evolve</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Your playstyle shapes your NFT. Battle, evolve, and create<br />
            unique creatures that reflect how you play.
          </p>
          {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
            <div className="inline-block px-6 py-3 bg-purple-900/50 rounded-full border border-purple-500/50 mb-8">
              <span className="text-purple-400"> Demo Mode Active - No real transactions</span>
            </div>
          )}
        </motion.div>

        <h2 className="text-3xl font-bold text-white text-center mb-8">Choose Your Starter Soul</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {creatures.map((creature, index) => (
            <motion.div
              key={creature.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-purple-500 transition-all"
            >
              <div className={`h-48 rounded-lg bg-gradient-to-br ${creature.color} flex items-center justify-center mb-4`}>
                <span className="text-7xl">{creature.emoji}</span>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">{creature.name}</h3>
              <p className="text-gray-400 mb-4">{creature.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-gray-300">
                  <span className="text-sm">ATK: </span>
                  <span className="text-orange-400 font-bold">{creature.stats.attack}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-sm">DEF: </span>
                  <span className="text-blue-400 font-bold">{creature.stats.defense}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-sm">SPD: </span>
                  <span className="text-green-400 font-bold">{creature.stats.speed}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-sm">INT: </span>
                  <span className="text-purple-400 font-bold">{creature.stats.intelligence}</span>
                </div>
              </div>
              
              <button
                onClick={() => handleMint(creature)}
                disabled={minting}
                className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all ${
                  minting && selectedCreature === creature.name
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                {minting && selectedCreature === creature.name ? 'Minting...' : 'Mint Creature'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}