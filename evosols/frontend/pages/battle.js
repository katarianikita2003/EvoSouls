import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function Battle() {
  const router = useRouter();
  const { address } = useAccount();
  const [battleState, setBattleState] = useState(null);
  const [selectedMove, setSelectedMove] = useState(null);

  const moves = {
    attack: [
      { name: 'Savage Strike', power: 120, category: 'attack' },
      { name: 'Power Attack', power: 100, category: 'attack' },
      { name: 'Counter Strike', power: 80, category: 'attack' }
    ],
    defend: [
      { name: 'Reckless Guard', power: 30, category: 'defend' },
      { name: 'Steady Defense', power: 0, category: 'defend' },
      { name: 'Iron Wall', power: 50, category: 'defend' }
    ],
    special: [
      { name: 'Berserker Rage', power: 150, category: 'special' },
      { name: 'Tactical Strike', power: 110, category: 'special' },
      { name: 'Healing Light', power: 50, category: 'special' }
    ]
  };

  const handleMove = (move) => {
    setSelectedMove(move);
    toast.success(`Used ${move.name}!`);
    // In a real implementation, this would send the move to the server
    setTimeout(() => setSelectedMove(null), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Battle Arena</h1>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 text-center mb-8">
            <p className="text-gray-300 text-lg">
              Battle system is in development. For the demo, you can explore the move selection interface.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Choose Your Move</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-purple-400 font-semibold mb-3">Attack</h3>
                {moves.attack.map((move) => (
                  <button
                    key={move.name}
                    onClick={() => handleMove(move)}
                    disabled={selectedMove !== null}
                    className="w-full mb-2 p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors"
                  >
                    <div className="font-bold">{move.name}</div>
                    <div className="text-xs">Power: {move.power}</div>
                  </button>
                ))}
              </div>
              
              <div>
                <h3 className="text-blue-400 font-semibold mb-3">Defend</h3>
                {moves.defend.map((move) => (
                  <button
                    key={move.name}
                    onClick={() => handleMove(move)}
                    disabled={selectedMove !== null}
                    className="w-full mb-2 p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
                  >
                    <div className="font-bold">{move.name}</div>
                    <div className="text-xs">Power: {move.power}</div>
                  </button>
                ))}
              </div>
              
              <div>
                <h3 className="text-orange-400 font-semibold mb-3">Special</h3>
                {moves.special.map((move) => (
                  <button
                    key={move.name}
                    onClick={() => handleMove(move)}
                    disabled={selectedMove !== null}
                    className="w-full mb-2 p-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded transition-colors"
                  >
                    <div className="font-bold">{move.name}</div>
                    <div className="text-xs">
                      {move.name === 'Healing Light' ? `Heal: ${move.power}` : `Power: ${move.power}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}