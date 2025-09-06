// backend/socketHandlers/battleSocket.js
const battles = new Map();
const matchmakingQueue = [];

class Battle {
  constructor(player1, player2) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.players = {
      [player1.id]: { ...player1, hp: 100, maxHp: 100, ready: false },
      [player2.id]: { ...player2, hp: 100, maxHp: 100, ready: false }
    };
    this.turn = player1.id;
    this.turnTimer = null;
    this.moveHistory = [];
    this.behaviorTracking = {
      [player1.id]: { aggressive: 0, defensive: 0, strategic: 0, risky: 0, adaptive: 0 },
      [player2.id]: { aggressive: 0, defensive: 0, strategic: 0, risky: 0, adaptive: 0 }
    };
  }

  executeMove(playerId, move) {
    if (this.turn !== playerId) return { error: 'Not your turn!' };
    
    const attacker = this.players[playerId];
    const defenderId = Object.keys(this.players).find(id => id !== playerId);
    const defender = this.players[defenderId];
    
    let damage = 0;
    let healing = 0;
    let message = '';
    
    // Track behavior based on move choice
    this.trackBehavior(playerId, move);
    
    // Execute move logic
    switch (move.type) {
      case 'attack':
        damage = this.calculateDamage(move.power, attacker, defender);
        defender.hp = Math.max(0, defender.hp - damage);
        message = `${attacker.creature.name} used ${move.name} for ${damage} damage!`;
        break;
        
      case 'defend':
        attacker.defending = true;
        attacker.defenseBoost = move.power;
        message = `${attacker.creature.name} used ${move.name}!`;
        break;
        
      case 'special':
        if (move.name === 'Healing Light') {
          healing = move.power;
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + healing);
          message = `${attacker.creature.name} healed for ${healing} HP!`;
        } else {
          damage = this.calculateDamage(move.power * 1.5, attacker, defender);
          defender.hp = Math.max(0, defender.hp - damage);
          message = `${attacker.creature.name} unleashed ${move.name} for ${damage} damage!`;
        }
        break;
    }
    
    // Record move
    this.moveHistory.push({
      turn: this.moveHistory.length + 1,
      player: playerId,
      move,
      damage,
      healing,
      timestamp: Date.now()
    });
    
    // Check for battle end
    if (defender.hp <= 0) {
      return {
        battleEnd: true,
        winner: playerId,
        loser: defenderId,
        message: `${attacker.creature.name} wins!`,
        behaviorData: this.behaviorTracking
      };
    }
    
    // Switch turns
    this.turn = defenderId;
    
    return {
      success: true,
      message,
      damage,
      healing,
      nextTurn: defenderId,
      state: this.getState()
    };
  }

  calculateDamage(basePower, attacker, defender) {
    const attackStat = attacker.creature.stats?.attack || 50;
    const defenseStat = defender.creature.stats?.defense || 50;
    const defenseModifier = defender.defending ? defender.defenseBoost : 0;
    
    const damage = Math.floor(
      (basePower * (attackStat / 100)) * (1 - (defenseStat + defenseModifier) / 200)
    );
    
    return Math.max(5, damage); // Minimum 5 damage
  }

  trackBehavior(playerId, move) {
    const tracking = this.behaviorTracking[playerId];
    
    switch (move.category) {
      case 'attack':
        if (move.power >= 120) tracking.aggressive += 2;
        else tracking.aggressive += 1;
        
        if (this.players[playerId].hp < 30) tracking.risky += 2;
        break;
        
      case 'defend':
        tracking.defensive += 2;
        if (this.players[playerId].hp > 70) tracking.strategic += 1;
        break;
        
      case 'special':
        if (move.name === 'Healing Light') {
          tracking.defensive += 1;
          if (this.players[playerId].hp < 50) tracking.strategic += 2;
        } else {
          tracking.aggressive += 1;
          tracking.risky += 1;
        }
        break;
    }
    
    // Track adaptiveness based on move variety
    const uniqueMoves = new Set(
      this.moveHistory
        .filter(h => h.player === playerId)
        .map(h => h.move.name)
    ).size;
    
    if (uniqueMoves >= 3) tracking.adaptive += 1;
  }

  getState() {
    return {
      id: this.id,
      players: this.players,
      turn: this.turn,
      moveHistory: this.moveHistory.slice(-5), // Last 5 moves
      behaviorTracking: this.behaviorTracking
    };
  }
}

export default function battleSocketHandler(io) {
  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Matchmaking
    socket.on('findMatch', (data) => {
      const player = {
        id: socket.id,
        address: data.address,
        creature: data.creature
      };

      // Check if already in queue
      const inQueue = matchmakingQueue.find(p => p.id === socket.id);
      if (inQueue) return;

      matchmakingQueue.push(player);
      socket.emit('matchmakingStatus', { status: 'searching', playersInQueue: matchmakingQueue.length });

      // Try to make a match
      if (matchmakingQueue.length >= 2) {
        const player1 = matchmakingQueue.shift();
        const player2 = matchmakingQueue.shift();

        const battle = new Battle(player1, player2);
        battles.set(battle.id, battle);

        // Join both players to battle room
        const room = `battle-${battle.id}`;
        io.sockets.sockets.get(player1.id)?.join(room);
        io.sockets.sockets.get(player2.id)?.join(room);

        // Notify both players
        io.to(room).emit('matchFound', {
          battleId: battle.id,
          state: battle.getState()
        });
      }
    });

    // Cancel matchmaking
    socket.on('cancelMatchmaking', () => {
      const index = matchmakingQueue.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        matchmakingQueue.splice(index, 1);
        socket.emit('matchmakingStatus', { status: 'cancelled' });
      }
    });

    // Battle moves
    socket.on('battleMove', (data) => {
      const battle = battles.get(data.battleId);
      if (!battle) return socket.emit('error', { message: 'Battle not found' });

      const result = battle.executeMove(socket.id, data.move);

      if (result.error) {
        socket.emit('error', { message: result.error });
      } else {
        const room = `battle-${data.battleId}`;
        io.to(room).emit('battleUpdate', result);

        // Handle battle end
        if (result.battleEnd) {
          io.to(room).emit('battleEnd', {
            winner: result.winner,
            loser: result.loser,
            behaviorData: result.behaviorData,
            rewards: {
              winner: { xp: 100, matic: 0.01 },
              loser: { xp: 50, matic: 0.005 }
            }
          });

          // Clean up
          battles.delete(data.battleId);
          io.in(room).socketsLeave(room);
        }
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      // Remove from matchmaking queue
      const queueIndex = matchmakingQueue.findIndex(p => p.id === socket.id);
      if (queueIndex !== -1) {
        matchmakingQueue.splice(queueIndex, 1);
      }

      // Handle active battles
      battles.forEach((battle, battleId) => {
        if (battle.players[socket.id]) {
          const room = `battle-${battleId}`;
          io.to(room).emit('playerDisconnected', { playerId: socket.id });
          battles.delete(battleId);
        }
      });
    });
  });
}