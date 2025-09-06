import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { useBlockchain } from '../hooks/useBlockchain';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { mintCreature, loading } = useBlockchain();
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [mintingCreature, setMintingCreature] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const creatures = [
    {
      name: 'Pyro Phoenix',
      element: 'fire',
      description: 'Born from volcanic ashes, masters offensive strategies',
      stats: { attack: 80, defense: 40, speed: 60, intelligence: 50 },
      color: 'from-orange-500 to-red-600',
      emoji: '🔥'
    },
    {
      name: 'Aqua Serpent',
      element: 'water',
      description: 'Ancient sea guardian, excels in balanced combat',
      stats: { attack: 60, defense: 60, speed: 50, intelligence: 60 },
      color: 'from-blue-500 to-cyan-600',
      emoji: '💧'
    },
    {
      name: 'Terra Golem',
      element: 'earth',
      description: 'Mountain defender, specializes in defensive tactics',
      stats: { attack: 40, defense: 80, speed: 30, intelligence: 70 },
      color: 'from-green-500 to-emerald-600',
      emoji: '🌿'
    }
  ];

  const handleMint = async (creature) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first!');
      return;
    }

    setMintingCreature(creature.name);

    try {
      // Generate creature image
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');

      // Draw creature background
      const gradient = ctx.createLinearGradient(0, 0, 500, 500);
      const colors = {
        fire: ['#ff6b6b', '#ff0000'],
        water: ['#4dabf7', '#0066ff'],
        earth: ['#51cf66', '#00aa00']
      };

      gradient.addColorStop(0, colors[creature.element][0]);
      gradient.addColorStop(1, colors[creature.element][1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 500, 500);

      // Add creature emoji
      ctx.font = '200px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(creature.emoji, 250, 250);

      // Convert to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

      // Mint creature
      const result = await mintCreature(creature.name, creature.element, blob);

      if (result.success) {
        toast.success('Successfully minted! Redirecting to collection...');
        setTimeout(() => {
          window.location.href = '/collection';
        }, 2000);
      }
    } catch (error) {
      console.error('Minting error:', error);
      toast.error('Minting failed. Please try again.');
    } finally {
      setMintingCreature(null);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
        <div className="container px-4 py-16 mx-auto">
          <div className="text-center">
            <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      {isConnected && <Navbar />}

      <div className="container px-4 py-16 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-6 text-5xl font-bold text-white md:text-6xl">
            AI-Driven NFTs That <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Evolve</span>
          </h1>
          <p className="max-w-3xl mx-auto mb-8 text-xl text-gray-300">
            Your playstyle shapes your NFT. Battle, evolve, and create<br />
            unique creatures that reflect how you play.
          </p>
          {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
            <div className="inline-block px-6 py-3 mb-8 border rounded-full bg-purple-900/50 border-purple-500/50">
              <span className="text-purple-400">🔴 Demo Mode Active - No real transactions</span>
            </div>
          )}
        </motion.div>

        <h2 className="mb-8 text-3xl font-bold text-center text-white">Choose Your Starter Soul</h2>

        <div className="grid max-w-6xl grid-cols-1 gap-8 mx-auto md:grid-cols-3">
          {creatures.map((creature, index) => (
            <motion.div
              key={creature.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 transition-all border border-gray-700 bg-gray-800/50 backdrop-blur-sm rounded-2xl hover:border-purple-500"
            >
              <div className={`h-48 rounded-lg bg-gradient-to-br ${creature.color} flex items-center justify-center mb-4`}>
                <span className="text-7xl">{creature.emoji}</span>
              </div>

              <h3 className="mb-2 text-2xl font-bold text-white">{creature.name}</h3>
              <p className="mb-4 text-gray-400">{creature.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-gray-300">
                  <span className="text-sm">ATK: </span>
                  <span className="font-bold text-orange-400">{creature.stats.attack}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-sm">DEF: </span>
                  <span className="font-bold text-blue-400">{creature.stats.defense}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-sm">SPD: </span>
                  <span className="font-bold text-green-400">{creature.stats.speed}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-sm">INT: </span>
                  <span className="font-bold text-purple-400">{creature.stats.intelligence}</span>
                </div>
              </div>

              <button
                onClick={() => handleMint(creature)}
                disabled={loading || mintingCreature === creature.name}
                className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all ${loading || mintingCreature === creature.name
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  }`}
              >
                {mintingCreature === creature.name ? 'Minting...' : 'Mint Creature (0.5 MATIC)'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}