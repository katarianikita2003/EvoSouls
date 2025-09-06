import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import Navbar from '../components/Navbar';
import { useBlockchain } from '../hooks/useBlockchain';

export default function Battle() {
  const router = useRouter();
  const { address } = useAccount();
  const { creatures, battle: executeBattle, loading } = useBlockchain();
  const [socket, setSocket] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [selectedMove, setSelectedMove] = useState(null);
  const [searching, setSearching] = useState(false);

  const moves = {
    attack: [
      { id: 'savage_strike', name: 'Savage Strike', power: 120, energyCost: 30, type: 'attack' },
      { id: 'power_attack', name: 'Power Attack', power: 80, energyCost: 20, type: 'attack' },
      { id: 'quick_strike', name: 'Quick Strike', power: 50, energyCost: 10, type: 'attack' }
    ],
    defend: [
      { id: 'iron_wall', name: 'Iron Wall', power: 0, energyCost: 20, type: 'defend' },
      { id: 'healing_light', name: 'Healing Light', power: 30, energyCost: 25, type: 'heal' },
      { id: 'counter_stance', name: 'Counter Stance', power: 0, energyCost: 15, type: 'counter' }
    ],
    special: [
      { id: 'berserker_rage', name: 'Berserker Rage', power: 150, energyCost: 50, type: 'special' },
      { id: 'tactical_strike', name: 'Tactical Strike', power: 100, energyCost: 40, type: 'special' },
      { id: 'energy_burst', name: 'Energy Burst', power: 80, energyCost: 0, type: 'special' }
    ]
  };

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('battleStarted', (data) => {
      setBattleState(data);
      setSearching(false);
      toast.success('Battle started!');
    });

    newSocket.on('moveExecuted', (data) => {
      setBattleState(data.battleState);
      
      if (data.damage > 0) {
        toast(`${data.damage} damage dealt!`);
      }
      if (data.healing > 0) {
        toast.success(`${data.healing} HP restored!`);
      }
    });

    newSocket.on('battleEnded', (data) => {
      if (data.winner === address) {
        toast.success('Victory! You won the battle!');
      } else {
        toast.error('Defeat! Better luck next time.');
      }
      
      setTimeout(() => {
        router.push('/collection');
      }, 3000);
    });

    newSocket.on('error', (data) => {
      toast.error(data.message);
    });

    return () => newSocket.close();
  }, [address, router]);

  const findMatch = () => {
    if (!selectedCreature || !socket) return;
    
    setSearching(true);
    
    // For demo, create a mock opponent
    const mockOpponent = {
      address: '0x' + '0'.repeat(39) + '1',
      creatureId: 'opponent-' + Date.now()
    };
    
    socket.emit('joinBattle', {
      player1: {
        address: address,
        creatureId: selectedCreature.tokenId
      },
      player2: mockOpponent
    });
  };

  const handleMove = async (move) => {
    if (!battleState || battleState.currentPlayer !== address) {
      toast.error('Not your turn!');
      return;
    }
    
    const attacker = battleState.player1.address === address 
      ? battleState.player1 : battleState.player2;
      
    if (attacker.creature.currentEnergy < move.energyCost) {
      toast.error('Not enough energy!');
      return;
    }
    
    setSelectedMove(move);
    
    // Execute on blockchain (optional for demo)
    if (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS) {
      try {
        const moveType = ['attack', 'defend', 'special'].indexOf(
          Object.keys(moves).find(category => 
            moves[category].some(m => m.id === move.id)
          )
        );
        
        await executeBattle(
          attacker.creature.tokenId,
          battleState.player2.creature.tokenId,
          [moveType]
        );
      } catch (error) {
        console.error('Blockchain battle failed:', error);
      }
    }
    
    // Execute move in real-time
    socket.emit('executeMove', {
      battleId: battleState.battleId,
      playerAddress: address,
      move: move
    });
    
    setTimeout(() => setSelectedMove(null), 1000);
  };

  const getHealthBarColor = (hp, maxHp) => {
    const percentage = (hp / maxHp) * 100;
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!battleState && !searching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
        <Navbar />
        <div className="container px-4 py-8 mx-auto">
          <h1 className="mb-8 text-4xl font-bold text-center text-white">Battle Arena</h1>
          
          <div className="max-w-4xl mx-auto">
            <div className="p-6 mb-8 rounded-lg bg-gray-800/50 backdrop-blur-sm">
              <h2 className="mb-4 text-2xl font-bold text-white">Select Your Fighter</h2>
              
              {creatures.length === 0 ? (
                <p className="text-gray-300">You need to mint a creature first!</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-3">
                  {creatures.map((creature) => (
                    <button
                      key={creature.tokenId}
                      onClick={() => setSelectedCreature(creature)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedCreature?.tokenId === creature.tokenId
                          ? 'border-purple-500 bg-purple-900/50'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <h3 className="font-bold text-white">{creature.name}</h3>
                      <p className="text-sm text-gray-400">Level {creature.level}</p>
                      <p className="text-sm text-gray-400">{creature.element}</p>
                      <p className="text-sm text-gray-400">
                        {creature.battleStats.totalBattles} battles
                      </p>
                    </button>
                  ))}
                </div>
              )}
              
              <button
                onClick={findMatch}
                disabled={!selectedCreature || searching}
                className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all ${
                  !selectedCreature || searching
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                {searching ? 'Finding opponent...' : 'Find Match'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (searching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
            <h2 className="text-2xl font-bold text-white">Finding opponent...</h2>
          </div>
        </div>
      </div>
    );
  }

  const player = battleState.player1.address === address 
    ? battleState.player1 : battleState.player2;
  const opponent = battleState.player1.address === address 
    ? battleState.player2 : battleState.player1;
  const isMyTurn = battleState.currentPlayer === address;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <Navbar />
      
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-4 text-4xl font-bold text-center text-white">Battle Arena</h1>
        <p className="mb-8 text-center text-gray-300">Turn {battleState.turn}</p>
        
        {/* Battle Field */}
        <div className="grid max-w-6xl grid-cols-2 gap-8 mx-auto mb-8">
          {/* Player Side */}
          <motion.div 
            className="p-6 rounded-lg bg-gray-800/50 backdrop-blur"
            animate={selectedMove ? { scale: [1, 1.05, 1] } : {}}
          >
            <h2 className="mb-4 text-2xl font-bold text-white">{player.creature.name}</h2>
            
            {/* Health Bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-1 text-sm text-gray-300">
                <span>HP</span>
                <span>{player.creature.currentHp}/{player.creature.stats.maxHp}</span>
              </div>
              <div className="w-full h-4 overflow-hidden bg-gray-700 rounded-full">
                <motion.div 
                  className={`h-full ${getHealthBarColor(player.creature.currentHp, player.creature.stats.maxHp)}`}
                  animate={{ width: `${(player.creature.currentHp / player.creature.stats.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Energy Bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-1 text-sm text-gray-300">
                <span>Energy</span>
                <span>{player.creature.currentEnergy}/{player.creature.stats.maxEnergy}</span>
              </div>
              <div className="w-full h-3 overflow-hidden bg-gray-700 rounded-full">
                <motion.div 
                  className="h-full bg-blue-500"
                  animate={{ width: `${(player.creature.currentEnergy / player.creature.stats.maxEnergy) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">ATK: <span className="text-orange-400">{player.creature.stats.attack}</span></div>
              <div className="text-gray-400">DEF: <span className="text-blue-400">{player.creature.stats.defense}</span></div>
              <div className="text-gray-400">SPD: <span className="text-green-400">{player.creature.stats.speed}</span></div>
              <div className="text-gray-400">INT: <span className="text-purple-400">{player.creature.stats.intelligence}</span></div>
            </div>
          </motion.div>

          {/* Opponent Side */}
          <div className="p-6 rounded-lg bg-gray-800/50 backdrop-blur">
            <h2 className="mb-4 text-2xl font-bold text-white">{opponent.creature.name}</h2>
            
            {/* Health Bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-1 text-sm text-gray-300">
                <span>HP</span>
                <span>{opponent.creature.currentHp}/{opponent.creature.stats.maxHp}</span>
              </div>
              <div className="w-full h-4 overflow-hidden bg-gray-700 rounded-full">
                <motion.div 
                  className={`h-full ${getHealthBarColor(opponent.creature.currentHp, opponent.creature.stats.maxHp)}`}
                  animate={{ width: `${(opponent.creature.currentHp / opponent.creature.stats.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Energy Bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-1 text-sm text-gray-300">
                <span>Energy</span>
                <span>{opponent.creature.currentEnergy}/{opponent.creature.stats.maxEnergy}</span>
              </div>
              <div className="w-full h-3 overflow-hidden bg-gray-700 rounded-full">
                <motion.div 
                  className="h-full bg-blue-500"
                  animate={{ width: `${(opponent.creature.currentEnergy / opponent.creature.stats.maxEnergy) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">ATK: <span className="text-orange-400">{opponent.creature.stats.attack}</span></div>
              <div className="text-gray-400">DEF: <span className="text-blue-400">{opponent.creature.stats.defense}</span></div>
              <div className="text-gray-400">SPD: <span className="text-green-400">{opponent.creature.stats.speed}</span></div>
              <div className="text-gray-400">INT: <span className="text-purple-400">{opponent.creature.stats.intelligence}</span></div>
            </div>
          </div>
        </div>
        
        {/* Move Selection */}
        <div className="max-w-4xl p-6 mx-auto rounded-lg bg-gray-800/50 backdrop-blur">
          <h3 className="mb-4 text-xl font-bold text-white">
            {isMyTurn ? 'Your Turn - Choose Your Move!' : "Opponent's Turn"}
          </h3>
          
          {isMyTurn && (
            <div className="grid grid-cols-3 gap-4">
              {/* Attack Moves */}
              <div>
                <h4 className="mb-2 font-semibold text-orange-400">Attack</h4>
                <div className="space-y-2">
                  {moves.attack.map(move => (
                    <button
                      key={move.id}
                      onClick={() => handleMove(move)}
                      disabled={player.creature.currentEnergy < move.energyCost}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        player.creature.currentEnergy < move.energyCost
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-orange-600/20 hover:bg-orange-600/30 text-white border border-orange-500/50'
                      }`}
                    >
                      <div className="font-semibold">{move.name}</div>
                      <div className="text-sm">Power: {move.power}</div>
                      <div className="text-xs text-gray-400">Energy: {move.energyCost}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Defense Moves */}
              <div>
                <h4 className="mb-2 font-semibold text-blue-400">Defense</h4>
                <div className="space-y-2">
                  {moves.defend.map(move => (
                    <button
                      key={move.id}
                      onClick={() => handleMove(move)}
                      disabled={player.creature.currentEnergy < move.energyCost}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        player.creature.currentEnergy < move.energyCost
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600/20 hover:bg-blue-600/30 text-white border border-blue-500/50'
                      }`}
                    >
                      <div className="font-semibold">{move.name}</div>
                      <div className="text-sm">{move.type === 'heal' ? `Heal: ${move.power}` : 'Effect'}</div>
                      <div className="text-xs text-gray-400">Energy: {move.energyCost}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Moves */}
              <div>
                <h4 className="mb-2 font-semibold text-purple-400">Special</h4>
                <div className="space-y-2">
                  {moves.special.map(move => (
                    <button
                      key={move.id}
                      onClick={() => handleMove(move)}
                      disabled={player.creature.currentEnergy < move.energyCost && move.energyCost > 0}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        player.creature.currentEnergy < move.energyCost && move.energyCost > 0
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600/20 hover:bg-purple-600/30 text-white border border-purple-500/50'
                      }`}
                    >
                      <div className="font-semibold">{move.name}</div>
                      <div className="text-sm">Power: {move.power}</div>
                      <div className="text-xs text-gray-400">
                        {move.energyCost === 0 ? 'Uses all energy' : `Energy: ${move.energyCost}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {!isMyTurn && (
            <div className="text-center text-gray-400">
              <div className="animate-pulse">Waiting for opponent's move...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}