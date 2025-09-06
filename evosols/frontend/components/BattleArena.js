// frontend/components/BattleArena.js
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

export default function BattleArena({ creature, onBattleEnd }) {
  const [socket, setSocket] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [selectedMove, setSelectedMove] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [battleLog, setBattleLog] = useState([]);

  // Move definitions based on creature element
  const moves = {
    fire: [
      { name: 'Flame Strike', type: 'attack', power: 80, energy: 0, description: 'A basic fire attack' },
      { name: 'Heat Shield', type: 'defend', power: 40, energy: 0, description: 'Reduces incoming damage' },
      { name: 'Inferno Burst', type: 'special', power: 120, energy: 50, description: 'Powerful fire explosion' },
      { name: 'Phoenix Rise', type: 'ultimate', power: 150, energy: 100, description: 'Ultimate fire attack' }
    ],
    water: [
      { name: 'Aqua Jet', type: 'attack', power: 75, energy: 0, description: 'Fast water attack' },
      { name: 'Ice Barrier', type: 'defend', power: 45, energy: 0, description: 'Defensive ice shield' },
      { name: 'Tidal Wave', type: 'special', power: 110, energy: 50, description: 'Massive water attack' },
      { name: 'Healing Light', type: 'special', power: 80, energy: 40, description: 'Restore HP' }
    ],
    earth: [
      { name: 'Rock Throw', type: 'attack', power: 85, energy: 0, description: 'Heavy earth attack' },
      { name: 'Stone Wall', type: 'defend', power: 50, energy: 0, description: 'Strong defense' },
      { name: 'Earthquake', type: 'special', power: 130, energy: 60, description: 'Ground shaking attack' },
      { name: 'Nature\'s Wrath', type: 'ultimate', power: 160, energy: 100, description: 'Ultimate earth power' }
    ]
  };

  useEffect(() => {
    // Connect to socket server
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:5000';
    const newSocket = io(socketUrl);
    
    newSocket.on('connect', () => {
      console.log('Connected to battle server');
    });

    newSocket.on('matchFound', (data) => {
      setBattleState(data.state);
      toast.success('Opponent found!');
    });

    newSocket.on('battleUpdate', (data) => {
      if (data.success) {
        setBattleState(data.state);
        setBattleLog(prev => [...prev, data.message]);
        setIsMyTurn(data.nextTurn === newSocket.id);
      }
    });

    newSocket.on('battleEnd', (data) => {
      const won = data.winner === newSocket.id;
      toast.success(won ? 'Victory!' : 'Defeat!');
      
      // Update behavior data
      const behaviorData = data.behaviorData[newSocket.id];
      onBattleEnd({
        won,
        behaviorData,
        rewards: data.rewards
      });
    });

    newSocket.on('playerDisconnected', () => {
      toast.error('Opponent disconnected');
      onBattleEnd({ won: true, forfeit: true });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const findMatch = () => {
    if (!socket) return;
    
    socket.emit('findMatch', {
      address: creature.owner,
      creature: {
        ...creature,
        stats: creature.stats || {
          attack: 50,
          defense: 50,
          speed: 50,
          intelligence: 50
        }
      }
    });
  };

  const executeMove = (move) => {
    if (!isMyTurn || !battleState) return;
    
    socket.emit('battleMove', {
      battleId: battleState.id,
      move: move
    });
    
    setSelectedMove(null);
  };

  const renderHealthBar = (hp, maxHp, isPlayer) => (
    <div className="w-full h-6 overflow-hidden bg-gray-700 rounded-full">
      <motion.div
        className={`h-full ${isPlayer ? 'bg-green-500' : 'bg-red-500'}`}
        initial={{ width: '100%' }}
        animate={{ width: `${(hp / maxHp) * 100}%` }}
        transition={{ duration: 0.5 }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
        {hp} / {maxHp}
      </span>
    </div>
  );

  if (!battleState) {
    return (
      <div className="py-8 text-center">
        <button
          onClick={findMatch}
          className="px-8 py-3 text-xl font-bold text-white rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          Find Match
        </button>
      </div>
    );
  }

  const myData = battleState.players[socket.id];
  const opponentData = Object.values(battleState.players).find(p => p !== myData);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Battle Field */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Player Side */}
        <div className="p-6 rounded-lg bg-gray-800/50">
          <h3 className="mb-2 text-xl font-bold text-white">{myData.creature.name}</h3>
          <div className="mb-4">
            {renderHealthBar(myData.hp, myData.maxHp, true)}
          </div>
          <div className="text-gray-300">
            <p>Element: {myData.creature.element}</p>
            <p>Level: {myData.creature.level}</p>
          </div>
        </div>

        {/* Opponent Side */}
        <div className="p-6 rounded-lg bg-gray-800/50">
          <h3 className="mb-2 text-xl font-bold text-white">{opponentData.creature.name}</h3>
          <div className="mb-4">
            {renderHealthBar(opponentData.hp, opponentData.maxHp, false)}
          </div>
          <div className="text-gray-300">
            <p>Element: {opponentData.creature.element}</p>
            <p>Level: {opponentData.creature.level}</p>
          </div>
        </div>
      </div>

      {/* Move Selection */}
      <div className="p-6 mb-6 rounded-lg bg-gray-800/50">
        <h3 className="mb-4 text-xl font-bold text-white">
          {isMyTurn ? 'Your Turn - Select a Move' : 'Opponent\'s Turn'}
        </h3>
        
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {moves[creature.element].map((move, index) => (
            <button
              key={index}
              onClick={() => executeMove(move)}
              disabled={!isMyTurn}
              className={`p-4 rounded-lg transition-all ${
                isMyTurn
                  ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
                  : 'bg-gray-700 cursor-not-allowed opacity-50'
              }`}
            >
              <h4 className="font-bold text-white">{move.name}</h4>
              <p className="text-sm text-gray-300">Power: {move.power}</p>
              {move.energy > 0 && (
                <p className="text-sm text-yellow-400">Energy: {move.energy}</p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Battle Log */}
      <div className="p-4 overflow-y-auto rounded-lg bg-gray-800/50 max-h-40">
        <h4 className="mb-2 font-bold text-white">Battle Log</h4>
        {battleLog.map((log, index) => (
          <p key={index} className="text-sm text-gray-300">
            {log}
          </p>
        ))}
      </div>
    </div>
  );
}