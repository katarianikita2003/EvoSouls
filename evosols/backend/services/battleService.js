import { Creature } from '../models/Creature.js';
import { Battle } from '../models/Battle.js';
import { v4 as uuidv4 } from 'uuid';

export class BattleService {
  constructor() {
    this.activeBattles = new Map();
    this.playerBattles = new Map();
    
    this.elementAdvantage = {
      fire: { strong: 'earth', weak: 'water' },
      water: { strong: 'fire', weak: 'earth' },
      earth: { strong: 'water', weak: 'fire' }
    };
    
    this.moves = {
      attack: [
        { id: 'savage_strike', name: 'Savage Strike', type: 'attack', power: 120, energyCost: 30 },
        { id: 'power_attack', name: 'Power Attack', type: 'attack', power: 80, energyCost: 20 },
        { id: 'quick_strike', name: 'Quick Strike', type: 'attack', power: 50, energyCost: 10 }
      ],
      defend: [
        { id: 'iron_wall', name: 'Iron Wall', type: 'defend', power: 0, energyCost: 20 },
        { id: 'healing_light', name: 'Healing Light', type: 'heal', power: 30, energyCost: 25 },
        { id: 'counter_stance', name: 'Counter Stance', type: 'counter', power: 0, energyCost: 15 }
      ],
      special: [
        { id: 'berserker_rage', name: 'Berserker Rage', type: 'special', power: 150, energyCost: 50 },
        { id: 'tactical_strike', name: 'Tactical Strike', type: 'special', power: 100, energyCost: 40 },
        { id: 'energy_burst', name: 'Energy Burst', type: 'special', power: 80, energyCost: 0 }
      ]
    };
  }

  async createBattle(player1Data, player2Data) {
    const battleId = uuidv4();
    
    // Fetch creatures
    const creature1 = await Creature.findOne({ tokenId: player1Data.creatureId });
    const creature2 = await Creature.findOne({ tokenId: player2Data.creatureId });
    
    if (!creature1 || !creature2) {
      throw new Error('Invalid creatures');
    }
    
    // Create battle record
    const battle = new Battle({
      battleId,
      player1: {
        address: player1Data.address,
        creatureId: player1Data.creatureId,
        creature: creature1._id
      },
      player2: {
        address: player2Data.address,
        creatureId: player2Data.creatureId,
        creature: creature2._id
      },
      status: 'active'
    });
    
    await battle.save();
    
    // Initialize battle state
    const battleState = {
      battleId,
      turn: 1,
      currentPlayer: player1Data.address,
      player1: {
        address: player1Data.address,
        creature: {
          ...creature1.toObject(),
          currentHp: creature1.stats.hp,
          currentEnergy: creature1.stats.energy,
          effects: [],
          defending: false
        }
      },
      player2: {
        address: player2Data.address,
        creature: {
          ...creature2.toObject(),
          currentHp: creature2.stats.hp,
          currentEnergy: creature2.stats.energy,
          effects: [],
          defending: false
        }
      }
    };
    
    this.activeBattles.set(battleId, battleState);
    this.playerBattles.set(player1Data.address, battleId);
    this.playerBattles.set(player2Data.address, battleId);
    
    return battleState;
  }

  async executeMove(battleId, playerAddress, moveData) {
    const battleState = this.activeBattles.get(battleId);
    if (!battleState) throw new Error('Battle not found');
    
    if (battleState.currentPlayer !== playerAddress) {
      throw new Error('Not your turn');
    }
    
    const attacker = battleState.player1.address === playerAddress 
      ? battleState.player1 : battleState.player2;
    const defender = battleState.player1.address === playerAddress 
      ? battleState.player2 : battleState.player1;
    
    // Validate move
    const move = this.findMove(moveData.id);
    if (!move) throw new Error('Invalid move');
    
    // Check energy
    if (attacker.creature.currentEnergy < move.energyCost) {
      throw new Error('Insufficient energy');
    }
    
    // Reset defending status
    attacker.creature.defending = false;
    
    let damage = 0;
    let healing = 0;
    let effect = null;
    
    // Execute move based on type
    switch (move.type) {
      case 'attack':
      case 'special':
        damage = this.calculateDamage(move, attacker.creature, defender.creature);
        defender.creature.currentHp = Math.max(0, defender.creature.currentHp - damage);
        break;
        
      case 'defend':
        attacker.creature.defending = true;
        effect = 'Defending - damage reduced by 50%';
        break;
        
      case 'heal':
        healing = move.power;
        attacker.creature.currentHp = Math.min(
          attacker.creature.currentHp + healing,
          attacker.creature.stats.maxHp
        );
        break;
        
      case 'counter':
        attacker.creature.effects.push({ type: 'counter', turns: 1 });
        effect = 'Counter stance - will reflect next attack';
        break;
    }
    
    // Consume energy
    attacker.creature.currentEnergy -= move.energyCost;
    
    // Track behavior
    await this.trackBehavior(battleId, playerAddress, move, battleState);
    
    // Log the move
    const battle = await Battle.findOne({ battleId });
    battle.battleLog.push({
      turn: battleState.turn,
      player: playerAddress,
      move: move,
      damage,
      healing,
      effect
    });
    battle.totalTurns = battleState.turn;
    await battle.save();
    
    // Check for battle end
    if (defender.creature.currentHp <= 0) {
      return await this.endBattle(battleId, playerAddress);
    }
    
    // Switch turns
    battleState.turn += 1;
    battleState.currentPlayer = defender.address;
    
    // Regenerate energy
    attacker.creature.currentEnergy = Math.min(
      attacker.creature.currentEnergy + 10,
      attacker.creature.stats.maxEnergy
    );
    defender.creature.currentEnergy = Math.min(
      defender.creature.currentEnergy + 10,
      defender.creature.stats.maxEnergy
    );
    
    return {
      success: true,
      damage,
      healing,
      effect,
      battleState,
      nextTurn: defender.address
    };
  }

  calculateDamage(move, attacker, defender) {
    let baseDamage = move.power;
    
    // Apply stat modifiers
    const attackModifier = attacker.stats.attack / 100;
    const defenseModifier = defender.stats.defense / 200;
    
    // Apply defending status
    const defendingModifier = defender.defending ? 0.5 : 1;
    
    // Element advantage
    const elementMultiplier = this.getElementMultiplier(
      attacker.element,
      defender.element
    );
    
    // Level difference
    const levelModifier = 1 + (attacker.level - defender.level) * 0.05;
    
    // Random variance (90% - 110%)
    const variance = 0.9 + Math.random() * 0.2;
    
    const totalDamage = Math.floor(
      baseDamage * attackModifier * elementMultiplier * 
      levelModifier * variance * defendingModifier * (1 - defenseModifier)
    );
    
    return Math.max(5, totalDamage); // Minimum 5 damage
  }

  getElementMultiplier(attackerElement, defenderElement) {
    const advantage = this.elementAdvantage[attackerElement];
    if (advantage.strong === defenderElement) return 1.5;
    if (advantage.weak === defenderElement) return 0.75;
    return 1.0;
  }

  async trackBehavior(battleId, playerAddress, move, battleState) {
    const battle = await Battle.findOne({ battleId });
    const behaviorChanges = playerAddress === battle.player1.address
      ? battle.behaviorChanges.player1
      : battle.behaviorChanges.player2;
    
    const attacker = battleState.player1.address === playerAddress 
      ? battleState.player1 : battleState.player2;
    
    // Analyze move type and context
    switch (move.type) {
      case 'attack':
        if (move.power >= 100) {
          behaviorChanges.aggressive += 3;
        } else {
          behaviorChanges.aggressive += 1;
        }
        
        // Risky if low HP
        if (attacker.creature.currentHp < attacker.creature.stats.maxHp * 0.3) {
          behaviorChanges.risky += 2;
        }
        break;
        
      case 'defend':
        behaviorChanges.defensive += 2;
        
        // Strategic if high HP
        if (attacker.creature.currentHp > attacker.creature.stats.maxHp * 0.7) {
          behaviorChanges.strategic += 1;
        }
        break;
        
      case 'special':
        behaviorChanges.risky += 2;
        behaviorChanges.adaptive += 1;
        
        if (move.energyCost === 0) { // Energy burst
          behaviorChanges.strategic += 2;
        }
        break;
        
      case 'heal':
        behaviorChanges.defensive += 1;
        behaviorChanges.strategic += 2;
        break;
        
      case 'counter':
        behaviorChanges.strategic += 3;
        behaviorChanges.defensive += 1;
        break;
    }
    
    // Track adaptiveness based on move variety
    const recentMoves = battle.battleLog
      .filter(log => log.player === playerAddress)
      .slice(-5)
      .map(log => log.move.id);
    
    const uniqueMoves = new Set(recentMoves).size;
    if (uniqueMoves >= 3) {
      behaviorChanges.adaptive += 1;
    }
    
    await battle.save();
  }

  async endBattle(battleId, winnerId) {
    const battleState = this.activeBattles.get(battleId);
    const battle = await Battle.findOne({ battleId }).populate('player1.creature player2.creature');
    
    const winner = battleState.player1.address === winnerId 
      ? battleState.player1 : battleState.player2;
    const loser = battleState.player1.address === winnerId 
      ? battleState.player2 : battleState.player1;
    
    // Update battle result
    battle.status = 'completed';
    battle.result = {
      winner: winner.address,
      loser: loser.address,
      isDraw: false
    };
    battle.rewards = {
      winner: { experience: 100, matic: 0.01 },
      loser: { experience: 50, matic: 0.005 }
    };
    battle.endTime = new Date();
    battle.duration = Math.floor((battle.endTime - battle.startTime) / 1000);
    await battle.save();
    
    // Update creatures
    await this.updateCreatureStats(winner.creature, battle, true);
    await this.updateCreatureStats(loser.creature, battle, false);
    
    // Clean up
    this.activeBattles.delete(battleId);
    this.playerBattles.delete(winner.address);
    this.playerBattles.delete(loser.address);
    
    return {
      success: true,
      battleEnd: true,
      winner: winner.address,
      loser: loser.address,
      rewards: battle.rewards,
      behaviorUpdates: battle.behaviorChanges,
      winnerEvolvable: winner.creature.isEvolvable,
      loserEvolvable: loser.creature.isEvolvable
    };
  }

  async updateCreatureStats(creatureData, battle, isWinner) {
    const creature = await Creature.findOne({ 
      tokenId: creatureData.tokenId 
    });
    
    // Update battle stats
    creature.battleStats.totalBattles += 1;
    if (isWinner) {
      creature.battleStats.wins += 1;
    } else {
      creature.battleStats.losses += 1;
    }
    
    // Add experience
    const expGained = isWinner ? 100 : 50;
    const leveledUp = creature.addExperience(expGained);
    
    // Update behavior profile
    const behaviorChanges = creature._id.equals(battle.player1.creature._id)
      ? battle.behaviorChanges.player1
      : battle.behaviorChanges.player2;
    
    Object.keys(behaviorChanges).forEach(trait => {
      creature.behavior[trait] += behaviorChanges[trait];
    });
    
    // Check evolution eligibility
    creature.checkEvolution();
    creature.lastBattleTime = new Date();
    
    await creature.save();
    
    return { leveledUp, evolvable: creature.isEvolvable };
  }

  findMove(moveId) {
    for (const category of Object.values(this.moves)) {
      const move = category.find(m => m.id === moveId);
      if (move) return move;
    }
    return null;
  }

  handleDisconnect(playerId) {
    const battleId = this.playerBattles.get(playerId);
    if (battleId) {
      // Mark battle as abandoned
      Battle.findOneAndUpdate(
        { battleId },
        { status: 'abandoned', endTime: new Date() }
      ).exec();
      
      // Clean up
      this.activeBattles.delete(battleId);
      // Remove both players from the map
      const battleState = this.activeBattles.get(battleId);
      if (battleState) {
        this.playerBattles.delete(battleState.player1.address);
        this.playerBattles.delete(battleState.player2.address);
      }
    }
  }
}