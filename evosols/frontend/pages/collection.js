import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useBlockchain } from '../hooks/useBlockchain';
import toast from 'react-hot-toast';

export default function Collection() {
  const { address, isConnected } = useAccount();
  const { creatures, evolveCreature, loading, refreshCreatures } = useBlockchain();
  const [evolvingCreature, setEvolvingCreature] = useState(null);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState(null);

  useEffect(() => {
    if (isConnected && address) {
      refreshCreatures();
    }
  }, [isConnected, address]);

  const handleEvolve = async (creature) => {
    setEvolvingCreature(creature.tokenId);
    
    try {
      await evolveCreature(creature);
      toast.success('Evolution complete! Your creature has transformed.');
      await refreshCreatures();
      setShowEvolutionModal(false);
    } catch (error) {
      console.error('Evolution failed:', error);
    } finally {
      setEvolvingCreature(null);
    }
  };

  const getDominantBehavior = (behavior) => {
    if (!behavior) return 'Neutral';
    
    let dominant = 'neutral';
    let highestScore = 0;
    
    Object.entries(behavior).forEach(([trait, score]) => {
      if (score > highestScore) {
        highestScore = score;
        dominant = trait;
      }
    });
    
    return dominant.charAt(0).toUpperCase() + dominant.slice(1);
  };

  const getEvolutionColor = (stage) => {
    switch(stage) {
      case 'Base': return 'from-gray-600 to-gray-700';
      case 'Evolved': return 'from-purple-600 to-pink-600';
      case 'Ultimate': return 'from-yellow-600 to-orange-600';
      default: return 'from-gray-600 to-gray-700';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Connect Your Wallet</h2>
            <p className="text-gray-300">Please connect your wallet to view your collection</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <Navbar />
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-8 text-4xl font-bold text-center text-white">My Collection</h1>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="w-16 h-16 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : creatures.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-xl text-white">You don't have any creatures yet!</p>
            <a href="/" className="px-6 py-3 font-bold text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700">
              Mint Your First Creature
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {creatures.map((creature) => (
              <motion.div
                key={creature.tokenId}
                whileHover={{ scale: 1.02 }}
                className="p-6 transition-all border border-gray-700 rounded-lg bg-gray-800/50 backdrop-blur-sm hover:border-purple-500"
              >
                {/* Evolution Stage Badge */}
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getEvolutionColor(creature.evolutionStage)} mb-4`}>
                  {creature.evolutionStage}
                </div>
                
                <h3 className="mb-2 text-xl font-bold text-white">{creature.name}</h3>
                
                <div className="mb-4 space-y-2">
                  <p className="text-gray-300">Level: {creature.level}</p>
                  <p className="text-gray-300">Element: <span className="capitalize">{creature.element}</span></p>
                  <p className="text-gray-300">Battles: {creature.battleStats?.totalBattles || 0}</p>
                  <p className="text-gray-300">Win Rate: {creature.battleStats?.winRate || 0}%</p>
                  <p className="text-gray-300">
                    Behavior: <span className="text-purple-400">
                      {getDominantBehavior(creature.behavior)}
                    </span>
                  </p>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="text-gray-400">ATK: <span className="text-orange-400">{creature.stats?.attack}</span></div>
                  <div className="text-gray-400">DEF: <span className="text-blue-400">{creature.stats?.defense}</span></div>
                  <div className="text-gray-400">SPD: <span className="text-green-400">{creature.stats?.speed}</span></div>
                  <div className="text-gray-400">INT: <span className="text-purple-400">{creature.stats?.intelligence}</span></div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedCreature(creature);
                      setShowEvolutionModal(true);
                    }}
                    className="flex-1 px-4 py-2 text-sm text-white transition-colors bg-gray-700 rounded-lg hover:bg-gray-600"
                  >
                    View Details
                  </button>
                  
                  {creature.isEvolvable && (
                    <button
                      onClick={() => handleEvolve(creature)}
                      disabled={evolvingCreature === creature.tokenId}
                      className={`flex-1 py-2 px-4 rounded-lg font-bold text-white transition-all text-sm ${
                        evolvingCreature === creature.tokenId
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 animate-pulse'
                      }`}
                    >
                      {evolvingCreature === creature.tokenId ? 'Evolving...' : 'Evolve!'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Evolution Modal */}
      {showEvolutionModal && selectedCreature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowEvolutionModal(false)}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl p-8 bg-gray-900 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-6 text-3xl font-bold text-white">{selectedCreature.name}</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-300">Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Attack:</span>
                    <span className="font-bold text-orange-400">{selectedCreature.stats?.attack}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Defense:</span>
                    <span className="font-bold text-blue-400">{selectedCreature.stats?.defense}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Speed:</span>
                    <span className="font-bold text-green-400">{selectedCreature.stats?.speed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Intelligence:</span>
                    <span className="font-bold text-purple-400">{selectedCreature.stats?.intelligence}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="mb-3 text-xl font-semibold text-gray-300">Behavior Profile</h3>
                <div className="space-y-2">
                  {Object.entries(selectedCreature.behavior || {}).map(([trait, value]) => (
                    <div key={trait} className="flex justify-between">
                      <span className="text-gray-400 capitalize">{trait}:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white">{value}</span>
                        <div className="w-20 h-2 bg-gray-700 rounded-full">
                          <div 
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${Math.min(value * 10, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {selectedCreature.isEvolvable && (
              <div className="p-4 mt-6 border rounded-lg bg-purple-900/30 border-purple-500/50">
                <p className="mb-4 text-center text-purple-300">
                  Your creature is ready to evolve! Evolution will permanently transform your NFT based on its dominant behavior.
                </p>
                <button
                  onClick={() => {
                    handleEvolve(selectedCreature);
                    setShowEvolutionModal(false);
                  }}
                  disabled={evolvingCreature === selectedCreature.tokenId}
                  className="w-full px-6 py-3 font-bold text-white transition-all rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Evolve Now (0.5 MATIC)
                </button>
              </div>
            )}
            
            <button
              onClick={() => setShowEvolutionModal(false)}
              className="w-full px-4 py-2 mt-4 text-white transition-colors bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}