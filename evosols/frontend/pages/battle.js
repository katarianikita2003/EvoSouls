// frontend/pages/battle.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import BattleArena from '../components/BattleArena';
import EvolutionModal from '../components/EvolutionModal';
import { useBlockchain } from '../hooks/useBlockchain';
import toast from 'react-hot-toast';

export default function Battle() {
  const router = useRouter();
  const { creatures, updateBattleStats, evolveCreature, isConnected } = useBlockchain();
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [inBattle, setInBattle] = useState(false);
  const [showEvolution, setShowEvolution] = useState(false);
  const [evolutionCreature, setEvolutionCreature] = useState(null);

  useEffect(() => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      router.push('/');
    }
  }, [isConnected, router]);

  const handleBattleEnd = async (result) => {
    setInBattle(false);
    
    if (result.forfeit) {
      toast.success('Opponent forfeited - You win!');
      return;
    }
    
    // Update creature stats
    try {
      await updateBattleStats(selectedCreature.tokenId, result.won);
      
      // Check for evolution
      const updatedBattleCount = selectedCreature.battleCount + 1;
      if (updatedBattleCount === 10 && selectedCreature.evolutionStage === 'Base') {
        setEvolutionCreature({
          ...selectedCreature,
          battleCount: updatedBattleCount,
          behavior: result.behaviorData
        });
        setShowEvolution(true);
      }
    } catch (error) {
      console.error('Error updating battle stats:', error);
    }
  };

  const handleEvolutionComplete = async (newForm) => {
    setShowEvolution(false);
    
    try {
      await evolveCreature(evolutionCreature.tokenId, 'Evolved', {
        ...evolutionCreature,
        name: newForm.name,
        evolutionStage: 'Evolved',
        appearance: newForm
      });
      
      toast.success('Your creature has evolved!');
      router.push('/collection');
    } catch (error) {
      console.error('Evolution error:', error);
    }
  };

  if (creatures.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">No Creatures Found</h2>
            <p className="mb-6 text-gray-300">You need to mint a creature first!</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
            >
              Mint Your First Creature
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <Navbar />
      
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-8 text-4xl font-bold text-center text-white">Battle Arena</h1>
        
        {!inBattle ? (
          <div className="max-w-4xl mx-auto">
            <div className="p-8 rounded-lg bg-gray-800/50 backdrop-blur-sm">
              <h2 className="mb-6 text-2xl font-bold text-white">Select Your Fighter</h2>
              
              {creatures.length > 0 ? (
                <div className="grid gap-4 mb-6">
                  {creatures.map((creature) => (
                    <motion.div
                      key={creature.tokenId}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedCreature(creature)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedCreature?.tokenId === creature.tokenId
                          ? 'bg-purple-600 border-2 border-purple-400'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">{creature.name}</h3>
                          <p className="text-gray-300">
                            Level {creature.level} | {creature.element} | 
                            {' '}{creature.wins}/{creature.battleCount} Wins
                          </p>
                        </div>
                        <div className="text-3xl">
                          {creature.element === 'fire' ? '🔥' : 
                           creature.element === 'water' ? '💧' : '🌱'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-gray-300">
                  You need to mint a creature first!
                </p>
              )}
              
              <button
                onClick={() => setInBattle(true)}
                disabled={!selectedCreature}
                className={`w-full py-4 px-6 rounded-lg font-bold text-white transition-all ${
                  selectedCreature
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                Find Match
              </button>
            </div>
          </div>
        ) : (
          <BattleArena 
            creature={selectedCreature}
            onBattleEnd={handleBattleEnd}
          />
        )}
      </div>
      
      {showEvolution && evolutionCreature && (
        <EvolutionModal
          creature={evolutionCreature}
          onComplete={handleEvolutionComplete}
        />
      )}
    </div>
  );
}