import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { mintCreature } from '../utils/verbwireIntegration';

const EnhancedLandingPage = () => {
  const { address, isConnected } = useAccount();
  const [minting, setMinting] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate floating particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10
    }));
    setParticles(newParticles);
  }, []);

  const creatures = [
    {
      name: 'Pyro Phoenix',
      element: 'fire',
      description: 'Born from volcanic ashes, masters offensive strategies',
      stats: { attack: 80, defense: 40, speed: 60, intelligence: 50 },
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      shadow: 'shadow-orange-500/50',
      emoji: '🔥',
      abilities: ['Flame Burst', 'Inferno Strike', 'Phoenix Rising']
    },
    {
      name: 'Aqua Serpent',
      element: 'water',
      description: 'Ancient sea guardian, excels in balanced combat',
      stats: { attack: 60, defense: 60, speed: 50, intelligence: 60 },
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      shadow: 'shadow-blue-500/50',
      emoji: '💧',
      abilities: ['Tidal Wave', 'Frost Shield', 'Deep Freeze']
    },
    {
      name: 'Terra Golem',
      element: 'earth',
      description: 'Mountain defender, specializes in defensive tactics',
      stats: { attack: 40, defense: 80, speed: 30, intelligence: 70 },
      gradient: 'from-green-500 via-emerald-500 to-lime-500',
      shadow: 'shadow-green-500/50',
      emoji: '🌿',
      abilities: ['Earthquake', 'Stone Wall', 'Natural Armor']
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
      // Show minting animation
      toast.loading('Minting your creature...', { id: 'minting' });

      // Mint with Verbwire
      const result = await mintCreature(address, {
        ...creature,
        owner: address,
        level: 1,
        evolutionStage: 'Base',
        battleCount: 0,
        wins: 0
      });

      if (result.success) {
        toast.success('Creature minted successfully!', { id: 'minting' });
        
        // Register in backend
        await fetch('http://localhost:5000/api/creatures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...creature,
            owner: address,
            tokenId: result.tokenId,
            transactionHash: result.transactionHash
          })
        });

        // Redirect to collection after short delay
        setTimeout(() => {
          window.location.href = '/collection';
        }, 2000);
      }
    } catch (error) {
      toast.error('Minting failed. Please try again.', { id: 'minting' });
      console.error('Minting error:', error);
    } finally {
      setMinting(false);
      setSelectedCreature(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20" />
        
        {/* Floating Particles */}
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white/10"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`
            }}
            animate={{
              x: [0, 30, -30, 0],
              y: [0, -30, 30, 0]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}

        {/* Gradient Orbs */}
        <motion.div
          className="absolute rounded-full top-20 left-20 w-96 h-96 bg-purple-600/30 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute rounded-full bottom-20 right-20 w-96 h-96 bg-blue-600/30 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {isConnected && <Navbar />}
        
        <div className="container px-4 py-16 mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 text-center"
          >
            <motion.h1
              className="mb-6 text-6xl font-black text-white md:text-8xl"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                EvoSouls
              </span>
            </motion.h1>
            
            <motion.p
              className="mb-4 text-2xl text-gray-300 md:text-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              NFTs That <span className="font-bold text-purple-400">Evolve</span> With Your Playstyle
            </motion.p>
            
            <motion.p
              className="max-w-2xl mx-auto mb-8 text-lg text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Battle, evolve, and create unique creatures that reflect how you play.
              Your strategy shapes your NFT's destiny.
            </motion.p>

            {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="inline-flex items-center gap-2 px-6 py-3 border rounded-full bg-purple-900/50 backdrop-blur border-purple-500/50"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-purple-300">Demo Mode Active</span>
              </motion.div>
            )}
          </motion.div>

          {/* Creature Selection */}
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mb-12 text-4xl font-bold text-center text-white"
          >
            Choose Your Starter Soul
          </motion.h2>

          <div className="grid grid-cols-1 gap-8 mx-auto md:grid-cols-3 max-w-7xl">
            {creatures.map((creature, index) => (
              <motion.div
                key={creature.name}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
                className="relative group"
              >
                <motion.div
                  className={`relative bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 overflow-hidden transition-all duration-300 ${
                    hoveredCard === index ? 'border-purple-500' : ''
                  }`}
                  whileHover={{ y: -10 }}
                  style={{
                    boxShadow: hoveredCard === index 
                      ? '0 20px 40px rgba(139, 92, 246, 0.3)' 
                      : '0 10px 20px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {/* Glow Effect */}
                  <AnimatePresence>
                    {hoveredCard === index && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 bg-gradient-to-br ${creature.gradient} opacity-10`}
                      />
                    )}
                  </AnimatePresence>

                  {/* Creature Visual */}
                  <motion.div
                    className={`relative h-64 rounded-xl bg-gradient-to-br ${creature.gradient} p-8 mb-6 overflow-hidden`}
                    animate={{
                      scale: hoveredCard === index ? 1.05 : 1
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Inner Glow */}
                    <motion.div
                      className="absolute inset-0 bg-white/20 rounded-xl"
                      animate={{
                        opacity: hoveredCard === index ? [0.2, 0.4, 0.2] : 0
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity
                      }}
                    />
                    
                    {/* Creature Emoji */}
                    <motion.div
                      className="relative flex items-center justify-center h-full text-center text-8xl"
                      animate={{
                        rotate: hoveredCard === index ? [0, 10, -10, 0] : 0,
                        scale: hoveredCard === index ? [1, 1.1, 1] : 1
                      }}
                      transition={{
                        duration: 2,
                        repeat: hoveredCard === index ? Infinity : 0
                      }}
                    >
                      {creature.emoji}
                    </motion.div>

                    {/* Particle Effects */}
                    <AnimatePresence>
                      {hoveredCard === index && (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 bg-white rounded-full"
                              initial={{
                                x: Math.random() * 200 - 100,
                                y: 200,
                                opacity: 0
                              }}
                              animate={{
                                y: -200,
                                opacity: [0, 1, 0]
                              }}
                              transition={{
                                duration: 2,
                                delay: i * 0.2,
                                repeat: Infinity
                              }}
                            />
                          ))}
                        </>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Creature Info */}
                  <h3 className="mb-2 text-2xl font-bold text-white">{creature.name}</h3>
                  <p className="mb-6 text-gray-400">{creature.description}</p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">ATK</span>
                        <span className="text-lg font-bold text-orange-400">{creature.stats.attack}</span>
                      </div>
                      <div className="w-full h-2 mt-1 bg-gray-700 rounded-full">
                        <motion.div
                          className="h-full bg-orange-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${creature.stats.attack}%` }}
                          transition={{ duration: 1, delay: 1.2 + index * 0.1 }}
                        />
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">DEF</span>
                        <span className="text-lg font-bold text-blue-400">{creature.stats.defense}</span>
                      </div>
                      <div className="w-full h-2 mt-1 bg-gray-700 rounded-full">
                        <motion.div
                          className="h-full bg-blue-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${creature.stats.defense}%` }}
                          transition={{ duration: 1, delay: 1.3 + index * 0.1 }}
                        />
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">SPD</span>
                        <span className="text-lg font-bold text-green-400">{creature.stats.speed}</span>
                      </div>
                      <div className="w-full h-2 mt-1 bg-gray-700 rounded-full">
                        <motion.div
                          className="h-full bg-green-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${creature.stats.speed}%` }}
                          transition={{ duration: 1, delay: 1.4 + index * 0.1 }}
                        />
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">INT</span>
                        <span className="text-lg font-bold text-purple-400">{creature.stats.intelligence}</span>
                      </div>
                      <div className="w-full h-2 mt-1 bg-gray-700 rounded-full">
                        <motion.div
                          className="h-full bg-purple-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${creature.stats.intelligence}%` }}
                          transition={{ duration: 1, delay: 1.5 + index * 0.1 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Abilities Preview */}
                  <div className="mb-6">
                    <p className="mb-2 text-sm text-gray-400">Starting Abilities:</p>
                    <div className="flex flex-wrap gap-2">
                      {creature.abilities.map((ability, i) => (
                        <motion.span
                          key={ability}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.6 + index * 0.1 + i * 0.05 }}
                          className="px-3 py-1 text-xs text-purple-300 border rounded-full bg-purple-900/50 border-purple-700/50"
                        >
                          {ability}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Mint Button */}
                  <motion.button
                    onClick={() => handleMint(creature)}
                    disabled={minting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all relative overflow-hidden ${
                      minting && selectedCreature === creature.name
                        ? 'bg-gray-700 cursor-not-allowed'
                        : `bg-gradient-to-r ${creature.gradient} hover:shadow-lg ${creature.shadow}`
                    }`}
                  >
                    {/* Button Shine Effect */}
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: '-100%', skewX: '-20deg' }}
                      animate={{
                        x: hoveredCard === index ? '200%' : '-100%'
                      }}
                      transition={{ duration: 0.5 }}
                    />
                    
                    <span className="relative">
                      {minting && selectedCreature === creature.name 
                        ? 'Minting...' 
                        : 'Mint Creature (0.5 MATIC)'
                      }
                    </span>
                  </motion.button>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-24 text-center"
          >
            <h3 className="mb-12 text-3xl font-bold text-white">How It Works</h3>
            <div className="grid max-w-4xl grid-cols-1 gap-8 mx-auto md:grid-cols-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 border border-gray-800 bg-gray-900/50 backdrop-blur rounded-xl"
              >
                <div className="mb-4 text-4xl">⚔️</div>
                <h4 className="mb-2 text-xl font-bold text-white">Battle</h4>
                <p className="text-gray-400">Engage in strategic turn-based battles against other players</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 border border-gray-800 bg-gray-900/50 backdrop-blur rounded-xl"
              >
                <div className="mb-4 text-4xl">🧬</div>
                <h4 className="mb-2 text-xl font-bold text-white">Evolve</h4>
                <p className="text-gray-400">Your playstyle shapes your creature's evolution path</p>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 border border-gray-800 bg-gray-900/50 backdrop-blur rounded-xl"
              >
                <div className="mb-4 text-4xl">🏆</div>
                <h4 className="mb-2 text-xl font-bold text-white">Dominate</h4>
                <p className="text-gray-400">Climb the leaderboard with your unique evolved creature</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLandingPage;