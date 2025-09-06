import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

const BattleArena = ({ playerCreature, opponentCreature, battleId }) => {
  const [socket, setSocket] = useState(null);
  const [battleState, setBattleState] = useState({
    player: { hp: 100, maxHp: 100, energy: 100 },
    opponent: { hp: 100, maxHp: 100, energy: 100 },
    turn: 'player',
    phase: 'selecting', // selecting, animating, waiting
    lastMove: null,
    winner: null
  });
  const [selectedMove, setSelectedMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [behaviorScore, setBehaviorScore] = useState({
    aggressive: 0,
    defensive: 0,
    strategic: 0,
    risky: 0,
    adaptive: 0
  });

  // Move definitions with behavior traits
  const moves = {
    attack: [
      { 
        id: 'savage_strike', 
        name: 'Savage Strike', 
        power: 120, 
        energy: 30, 
        type: 'attack',
        behavior: { aggressive: 3, risky: 1 },
        description: 'High damage, high risk',
        animation: 'shake'
      },
      { 
        id: 'power_attack', 
        name: 'Power Attack', 
        power: 80, 
        energy: 20, 
        type: 'attack',
        behavior: { aggressive: 2 },
        description: 'Balanced damage',
        animation: 'pulse'
      },
      { 
        id: 'quick_strike', 
        name: 'Quick Strike', 
        power: 50, 
        energy: 10, 
        type: 'attack',
        behavior: { strategic: 1 },
        description: 'Low cost, reliable',
        animation: 'flash'
      }
    ],
    defend: [
      { 
        id: 'iron_wall', 
        name: 'Iron Wall', 
        power: 0, 
        energy: 20, 
        type: 'defend',
        behavior: { defensive: 3 },
        description: 'Reduce damage by 50%',
        animation: 'shield'
      },
      { 
        id: 'healing_light', 
        name: 'Healing Light', 
        power: -30, 
        energy: 25, 
        type: 'heal',
        behavior: { defensive: 2, strategic: 1 },
        description: 'Restore 30 HP',
        animation: 'heal'
      },
      { 
        id: 'counter_stance', 
        name: 'Counter Stance', 
        power: 0, 
        energy: 15, 
        type: 'counter',
        behavior: { strategic: 2, defensive: 1 },
        description: 'Counter next attack',
        animation: 'counter'
      }
    ],
    special: [
      { 
        id: 'berserker_rage', 
        name: 'Berserker Rage', 
        power: 150, 
        energy: 50, 
        type: 'ultimate',
        behavior: { aggressive: 4, risky: 3 },
        description: 'Massive damage, drain energy',
        animation: 'explosion'
      },
      { 
        id: 'tactical_strike', 
        name: 'Tactical Strike', 
        power: 100, 
        energy: 40, 
        type: 'special',
        behavior: { strategic: 3, adaptive: 1 },
        description: 'Bonus damage if opponent is low',
        animation: 'critical'
      },
      { 
        id: 'energy_burst', 
        name: 'Energy Burst', 
        power: 80, 
        energy: 0, 
        type: 'special',
        behavior: { adaptive: 2 },
        description: 'Uses all remaining energy',
        animation: 'burst'
      }
    ]
  };

  // Connect to socket
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('battleUpdate', (data) => {
      setBattleState(prev => ({
        ...prev,
        ...data.state
      }));
      if (data.damage) {
        showDamageAnimation(data.damage, data.target);
      }
    });

    newSocket.on('battleEnd', (data) => {
      setBattleState(prev => ({ ...prev, winner: data.winner }));
      // Update behavior scores
      setBehaviorScore(data.behaviorData[newSocket.id]);
    });

    return () => newSocket.close();
  }, []);

  const executeMove = useCallback((move) => {
    if (battleState.phase !== 'selecting' || battleState.turn !== 'player') return;
    if (battleState.player.energy < move.energy) {
      // Not enough energy
      return;
    }

    setSelectedMove(move);
    setBattleState(prev => ({ ...prev, phase: 'animating' }));

    // Update behavior tracking
    Object.entries(move.behavior || {}).forEach(([trait, value]) => {
      setBehaviorScore(prev => ({
        ...prev,
        [trait]: prev[trait] + value
      }));
    });

    // Send move to server
    if (socket) {
      socket.emit('battleMove', { battleId, move });
    }

    // Add to move history
    setMoveHistory(prev => [...prev, {
      move: move.name,
      turn: moveHistory.length + 1,
      damage: calculateDamage(move)
    }]);

    // Animate
    setTimeout(() => {
      setBattleState(prev => ({ ...prev, phase: 'waiting' }));
    }, 2000);
  }, [battleState, socket, battleId, moveHistory]);

  const calculateDamage = (move) => {
    if (move.type === 'heal') return Math.abs(move.power);
    if (move.type === 'defend' || move.type === 'counter') return 0;
    
    const baseDamage = move.power;
    const variance = Math.random() * 0.2 + 0.9; // 90-110% damage
    return Math.floor(baseDamage * variance);
  };

  const showDamageAnimation = (damage, target) => {
    // This would trigger visual damage numbers
    console.log(`${damage} damage to ${target}`);
  };

  const getMovesByCategory = (category) => moves[category] || [];

  const getHealthBarColor = (hp, maxHp) => {
    const percentage = (hp / maxHp) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-900 to-blue-900">
      <div className="max-w-6xl mx-auto">
        {/* Battle Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">Battle Arena</h1>
          <p className="text-gray-300">Turn {moveHistory.length + 1}</p>
        </div>

        {/* Battle Field */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Player Side */}
          <motion.div 
            className="relative"
            animate={battleState.lastMove?.target === 'player' ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur">
              <h2 className="mb-4 text-2xl font-bold text-white">{playerCreature.name}</h2>
              
              {/* Health Bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-1 text-sm text-gray-300">
                  <span>HP</span>
                  <span>{battleState.player.hp}/{battleState.player.maxHp}</span>
                </div>
                <div className="w-full h-4 overflow-hidden bg-gray-700 rounded-full">
                  <motion.div 
                    className={`h-full ${getHealthBarColor(battleState.player.hp, battleState.player.maxHp)}`}
                    initial={{ width: '100%' }}
                    animate={{ width: `${(battleState.player.hp / battleState.player.maxHp) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Energy Bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-1 text-sm text-gray-300">
                  <span>Energy</span>
                  <span>{battleState.player.energy}/100</span>
                </div>
                <div className="w-full h-3 overflow-hidden bg-gray-700 rounded-full">
                  <motion.div 
                    className="h-full bg-blue-500"
                    animate={{ width: `${battleState.player.energy}%` }}
                  />
                </div>
              </div>

              {/* Creature Visual */}
              <div className="flex items-center justify-center h-32 text-6xl rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
                {playerCreature.emoji || '🔮'}
              </div>
            </div>
          </motion.div>

          {/* Opponent Side */}
          <motion.div 
            className="relative"
            animate={battleState.lastMove?.target === 'opponent' ? { x: [10, -10, 10, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur">
              <h2 className="mb-4 text-2xl font-bold text-white">{opponentCreature?.name || 'Opponent'}</h2>
              
              {/* Health Bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-1 text-sm text-gray-300">
                  <span>HP</span>
                  <span>{battleState.opponent.hp}/{battleState.opponent.maxHp}</span>
                </div>
                <div className="w-full h-4 overflow-hidden bg-gray-700 rounded-full">
                  <motion.div 
                    className={`h-full ${getHealthBarColor(battleState.opponent.hp, battleState.opponent.maxHp)}`}
                    animate={{ width: `${(battleState.opponent.hp / battleState.opponent.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Energy Bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-1 text-sm text-gray-300">
                  <span>Energy</span>
                  <span>{battleState.opponent.energy}/100</span>
                </div>
                <div className="w-full h-3 overflow-hidden bg-gray-700 rounded-full">
                  <motion.div 
                    className="h-full bg-blue-500"
                    animate={{ width: `${battleState.opponent.energy}%` }}
                  />
                </div>
              </div>

              {/* Creature Visual */}
              <div className="flex items-center justify-center h-32 text-6xl rounded-lg bg-gradient-to-br from-red-600 to-orange-600">
                {opponentCreature?.emoji || '👹'}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Move Selection */}
        <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur">
          <h3 className="mb-4 text-xl font-bold text-white">
            {battleState.turn === 'player' ? 'Your Turn - Choose Your Move!' : "Opponent's Turn"}
          </h3>

          {battleState.turn === 'player' && battleState.phase === 'selecting' && (
            <div className="grid grid-cols-3 gap-4">
              {/* Attack Moves */}
              <div>
                <h4 className="mb-2 font-semibold text-orange-400">Attack</h4>
                <div className="space-y-2">
                  {getMovesByCategory('attack').map(move => (
                    <motion.button
                      key={move.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => executeMove(move)}
                      disabled={battleState.player.energy < move.energy}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        battleState.player.energy < move.energy
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-orange-600/20 hover:bg-orange-600/30 text-white border border-orange-500/50'
                      }`}
                    >
                      <div className="font-semibold">{move.name}</div>
                      <div className="text-sm text-gray-300">{move.description}</div>
                      <div className="mt-1 text-xs text-gray-400">Energy: {move.energy}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Defense Moves */}
              <div>
                <h4 className="mb-2 font-semibold text-blue-400">Defense</h4>
                <div className="space-y-2">
                  {getMovesByCategory('defend').map(move => (
                    <motion.button
                      key={move.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => executeMove(move)}
                      disabled={battleState.player.energy < move.energy}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        battleState.player.energy < move.energy
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600/20 hover:bg-blue-600/30 text-white border border-blue-500/50'
                      }`}
                    >
                      <div className="font-semibold">{move.name}</div>
                      <div className="text-sm text-gray-300">{move.description}</div>
                      <div className="mt-1 text-xs text-gray-400">Energy: {move.energy}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Special Moves */}
              <div>
                <h4 className="mb-2 font-semibold text-purple-400">Special</h4>
                <div className="space-y-2">
                  {getMovesByCategory('special').map(move => (
                    <motion.button
                      key={move.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => executeMove(move)}
                      disabled={battleState.player.energy < move.energy}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        battleState.player.energy < move.energy
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600/20 hover:bg-purple-600/30 text-white border border-purple-500/50'
                      }`}
                    >
                      <div className="font-semibold">{move.name}</div>
                      <div className="text-sm text-gray-300">{move.description}</div>
                      <div className="mt-1 text-xs text-gray-400">Energy: {move.energy}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {battleState.phase === 'animating' && selectedMove && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-white"
            >
              <p className="text-2xl font-bold">{playerCreature.name} used {selectedMove.name}!</p>
            </motion.div>
          )}

          {battleState.phase === 'waiting' && (
            <div className="text-center text-gray-300">
              <p className="text-xl">Waiting for opponent...</p>
            </div>
          )}
        </div>

        {/* Behavior Tracking Display */}
        <div className="p-4 mt-4 rounded-lg bg-gray-800/50 backdrop-blur">
          <h4 className="mb-2 font-semibold text-white">Behavior Analysis</h4>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(behaviorScore).map(([trait, score]) => (
              <div key={trait} className="text-center">
                <div className="text-xs text-gray-400 capitalize">{trait}</div>
                <div className="text-lg font-bold text-purple-400">{score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Battle End Modal */}
        <AnimatePresence>
          {battleState.winner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md p-8 text-center bg-gray-900 rounded-lg"
              >
                <h2 className="mb-4 text-3xl font-bold text-white">
                  {battleState.winner === 'player' ? 'Victory!' : 'Defeat!'}
                </h2>
                <p className="mb-6 text-gray-300">
                  Your creature gained experience and evolved its behavior!
                </p>
                <div className="p-4 mb-6 bg-gray-800 rounded">
                  <h3 className="mb-2 font-semibold text-white">Dominant Behavior</h3>
                  <p className="text-2xl text-purple-400">
                    {Object.entries(behaviorScore).reduce((a, b) => b[1] > a[1] ? b : a)[0]}
                  </p>
                </div>
                <button
                  onClick={() => window.location.href = '/collection'}
                  className="px-6 py-3 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  View Collection
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BattleArena;