// backend/services/behaviorAnalysis.js
export class BehaviorAnalyzer {
  constructor() {
    this.behaviorWeights = {
      aggressive: 0,
      defensive: 0,
      strategic: 0,
      risky: 0,
      adaptive: 0
    };

    // Move behavior mappings
    this.moveBehaviors = {
      // Attack moves
      savage_strike: { aggressive: 3, risky: 1 },
      power_attack: { aggressive: 2 },
      quick_strike: { strategic: 1 },
      
      // Defense moves
      iron_wall: { defensive: 3 },
      healing_light: { defensive: 2, strategic: 1 },
      counter_stance: { strategic: 2, defensive: 1 },
      
      // Special moves
      berserker_rage: { aggressive: 4, risky: 3 },
      tactical_strike: { strategic: 3, adaptive: 1 },
      energy_burst: { adaptive: 2 }
    };

    // Situational modifiers
    this.situationModifiers = {
      lowHealth: { threshold: 30, modifiers: { risky: 2, strategic: -1 } },
      highHealth: { threshold: 70, modifiers: { aggressive: 1 } },
      enemyLowHealth: { threshold: 30, modifiers: { aggressive: 2, strategic: 1 } },
      energyManagement: { threshold: 20, modifiers: { strategic: 2, adaptive: 1 } }
    };

    // Evolution paths based on dominant behavior
    this.evolutionPaths = {
      aggressive: {
        name: 'Berserker',
        evolved: {
          name: 'Destroyer',
          statBoosts: { attack: 25, defense: -5, speed: 10 },
          newMoves: ['Rampage', 'Blood Fury'],
          visualTraits: { color: 'crimson', aura: 'fire', size: 1.2 }
        },
        ultimate: {
          name: 'Apocalypse',
          statBoosts: { attack: 40, defense: -10, speed: 20 },
          newMoves: ['Annihilation', 'Unstoppable Force'],
          visualTraits: { color: 'darkred', aura: 'inferno', size: 1.5 }
        }
      },
      defensive: {
        name: 'Guardian',
        evolved: {
          name: 'Fortress',
          statBoosts: { attack: -5, defense: 25, speed: -5, intelligence: 10 },
          newMoves: ['Aegis Shield', 'Regeneration'],
          visualTraits: { color: 'silver', aura: 'shield', size: 1.3 }
        },
        ultimate: {
          name: 'Bastion',
          statBoosts: { attack: 0, defense: 40, speed: -10, intelligence: 20 },
          newMoves: ['Impervious', 'Divine Protection'],
          visualTraits: { color: 'platinum', aura: 'fortress', size: 1.6 }
        }
      },
      strategic: {
        name: 'Tactician',
        evolved: {
          name: 'Mastermind',
          statBoosts: { attack: 10, defense: 10, intelligence: 20 },
          newMoves: ['Calculated Strike', 'Foresight'],
          visualTraits: { color: 'purple', aura: 'psychic', size: 1.1 }
        },
        ultimate: {
          name: 'Grandmaster',
          statBoosts: { attack: 15, defense: 15, intelligence: 35 },
          newMoves: ['Perfect Strategy', 'Mind Games'],
          visualTraits: { color: 'violet', aura: 'cosmic', size: 1.2 }
        }
      },
      risky: {
        name: 'Gambler',
        evolved: {
          name: 'Daredevil',
          statBoosts: { attack: 20, defense: -10, speed: 20, intelligence: 5 },
          newMoves: ['All or Nothing', 'Lucky Strike'],
          visualTraits: { color: 'gold', aura: 'chaos', size: 1.15 }
        },
        ultimate: {
          name: 'Chaos Lord',
          statBoosts: { attack: 30, defense: -15, speed: 30, intelligence: 10 },
          newMoves: ['Chaos Theory', 'Quantum Strike'],
          visualTraits: { color: 'rainbow', aura: 'unstable', size: 1.25 }
        }
      },
      adaptive: {
        name: 'Shapeshifter',
        evolved: {
          name: 'Metamorph',
          statBoosts: { attack: 10, defense: 10, speed: 10, intelligence: 15 },
          newMoves: ['Adapt', 'Mirror Match'],
          visualTraits: { color: 'iridescent', aura: 'shifting', size: 1.2 }
        },
        ultimate: {
          name: 'Transcendent',
          statBoosts: { attack: 15, defense: 15, speed: 15, intelligence: 25 },
          newMoves: ['Perfect Form', 'Evolution Burst'],
          visualTraits: { color: 'prismatic', aura: 'ethereal', size: 1.4 }
        }
      }
    };
  }

  // Analyze a single move in context
  analyzeMove(move, battleContext) {
    const behavior = { ...this.behaviorWeights };
    
    // Base behavior from move
    if (this.moveBehaviors[move.id]) {
      Object.entries(this.moveBehaviors[move.id]).forEach(([trait, value]) => {
        behavior[trait] += value;
      });
    }

    // Apply situational modifiers
    if (battleContext.playerHp < this.situationModifiers.lowHealth.threshold) {
      Object.entries(this.situationModifiers.lowHealth.modifiers).forEach(([trait, value]) => {
        behavior[trait] += value;
      });
      
      // Extra points for healing when low
      if (move.type === 'heal') behavior.strategic += 3;
      // Extra risky points for aggressive moves when low
      if (move.type === 'attack' && move.power > 100) behavior.risky += 3;
    }

    if (battleContext.opponentHp < this.situationModifiers.enemyLowHealth.threshold) {
      Object.entries(this.situationModifiers.enemyLowHealth.modifiers).forEach(([trait, value]) => {
        behavior[trait] += value;
      });
    }

    // Energy management
    if (battleContext.playerEnergy < this.situationModifiers.energyManagement.threshold) {
      if (move.energy === 0 || move.energy < 15) {
        behavior.strategic += 2;
        behavior.adaptive += 1;
      }
    }

    // Move diversity tracking
    if (battleContext.moveHistory && battleContext.moveHistory.length > 3) {
      const recentMoves = battleContext.moveHistory.slice(-3);
      const uniqueMoves = new Set(recentMoves.map(m => m.id)).size;
      if (uniqueMoves >= 3) behavior.adaptive += 2;
    }

    return behavior;
  }

  // Calculate cumulative behavior over multiple battles
  calculateCumulativeBehavior(battleHistories) {
    const cumulative = { ...this.behaviorWeights };
    let totalMoves = 0;

    battleHistories.forEach(battle => {
      battle.moves.forEach((move, index) => {
        const context = {
          playerHp: battle.hpHistory[index]?.player || 100,
          opponentHp: battle.hpHistory[index]?.opponent || 100,
          playerEnergy: battle.energyHistory[index]?.player || 100,
          moveHistory: battle.moves.slice(0, index)
        };

        const moveBehavior = this.analyzeMove(move, context);
        Object.keys(cumulative).forEach(trait => {
          cumulative[trait] += moveBehavior[trait];
        });
        totalMoves++;
      });
    });

    // Normalize scores
    Object.keys(cumulative).forEach(trait => {
      cumulative[trait] = Math.round(cumulative[trait] / totalMoves * 10) / 10;
    });

    return cumulative;
  }

  // Determine dominant behavior type
  getDominantBehavior(behaviorScores) {
    let dominant = 'adaptive'; // default
    let highestScore = 0;

    Object.entries(behaviorScores).forEach(([trait, score]) => {
      if (score > highestScore) {
        highestScore = score;
        dominant = trait;
      }
    });

    // Check for hybrid behaviors
    const scores = Object.values(behaviorScores);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - avgScore, 2), 0) / scores.length;

    // Low variance means balanced playstyle
    if (variance < 2) {
      return { type: 'balanced', primary: dominant, secondary: null };
    }

    // Find secondary behavior
    let secondary = null;
    let secondHighest = 0;
    Object.entries(behaviorScores).forEach(([trait, score]) => {
      if (trait !== dominant && score > secondHighest) {
        secondHighest = score;
        secondary = trait;
      }
    });

    // Check if secondary is strong enough for hybrid
    if (secondHighest >= highestScore * 0.7) {
      return { type: 'hybrid', primary: dominant, secondary };
    }

    return { type: 'pure', primary: dominant, secondary: null };
  }

  // Calculate evolution based on behavior
  calculateEvolution(creature, behaviorScores, battleCount) {
    const dominantBehavior = this.getDominantBehavior(behaviorScores);
    
    // Check evolution eligibility
    if (battleCount < 10) {
      return { eligible: false, reason: 'Not enough battles' };
    }

    const currentStage = creature.evolutionStage || 'Base';
    let nextStage = null;
    let evolutionData = null;

    if (currentStage === 'Base' && battleCount >= 10) {
      nextStage = 'Evolved';
    } else if (currentStage === 'Evolved' && battleCount >= 20) {
      nextStage = 'Ultimate';
    }

    if (!nextStage) {
      return { eligible: false, reason: 'Max evolution reached' };
    }

    // Get evolution path
    const evolutionPath = this.evolutionPaths[dominantBehavior.primary];
    evolutionData = nextStage === 'Evolved' ? evolutionPath.evolved : evolutionPath.ultimate;

    // Handle hybrid evolutions
    if (dominantBehavior.type === 'hybrid' && dominantBehavior.secondary) {
      const secondaryPath = this.evolutionPaths[dominantBehavior.secondary];
      const secondaryData = nextStage === 'Evolved' ? secondaryPath.evolved : secondaryPath.ultimate;
      
      // Merge evolution data
      evolutionData = {
        name: `${evolutionData.name}-${secondaryData.name}`,
        statBoosts: this.mergeStats(evolutionData.statBoosts, secondaryData.statBoosts),
        newMoves: [...evolutionData.newMoves, ...secondaryData.newMoves].slice(0, 3),
        visualTraits: this.mergeVisualTraits(evolutionData.visualTraits, secondaryData.visualTraits)
      };
    }

    return {
      eligible: true,
      nextStage,
      evolutionData,
      behaviorType: dominantBehavior,
      metadata: this.generateEvolutionMetadata(creature, evolutionData, behaviorScores)
    };
  }

  // Helper function to merge stats
  mergeStats(stats1, stats2) {
    const merged = {};
    const allKeys = new Set([...Object.keys(stats1), ...Object.keys(stats2)]);
    
    allKeys.forEach(key => {
      merged[key] = Math.round((stats1[key] || 0) * 0.6 + (stats2[key] || 0) * 0.4);
    });
    
    return merged;
  }

  // Helper function to merge visual traits
  mergeVisualTraits(traits1, traits2) {
    return {
      color: `${traits1.color}-${traits2.color}`,
      aura: `${traits1.aura}+${traits2.aura}`,
      size: (traits1.size + traits2.size) / 2
    };
  }

  // Generate metadata for NFT update
  generateEvolutionMetadata(creature, evolutionData, behaviorScores) {
    const newStats = {};
    Object.entries(creature.stats).forEach(([stat, value]) => {
      newStats[stat] = value + (evolutionData.statBoosts[stat] || 0);
    });

    return {
      name: `${evolutionData.name} ${creature.name}`,
      description: `A ${creature.element} creature that evolved through ${creature.battleCount} battles. Its dominant behavior is ${this.getDominantBehavior(behaviorScores).primary}.`,
      image: this.generateEvolutionImageUrl(creature, evolutionData),
      attributes: [
        { trait_type: 'Evolution Stage', value: evolutionData.name },
        { trait_type: 'Element', value: creature.element },
        { trait_type: 'Level', value: creature.level },
        { trait_type: 'Attack', value: newStats.attack },
        { trait_type: 'Defense', value: newStats.defense },
        { trait_type: 'Speed', value: newStats.speed },
        { trait_type: 'Intelligence', value: newStats.intelligence },
        { trait_type: 'Battles', value: creature.battleCount },
        { trait_type: 'Wins', value: creature.wins },
        { trait_type: 'Dominant Behavior', value: this.getDominantBehavior(behaviorScores).primary },
        { trait_type: 'Aggressive Score', value: behaviorScores.aggressive.toFixed(1) },
        { trait_type: 'Defensive Score', value: behaviorScores.defensive.toFixed(1) },
        { trait_type: 'Strategic Score', value: behaviorScores.strategic.toFixed(1) },
        { trait_type: 'Risky Score', value: behaviorScores.risky.toFixed(1) },
        { trait_type: 'Adaptive Score', value: behaviorScores.adaptive.toFixed(1) },
        ...evolutionData.newMoves.map((move, index) => ({
          trait_type: `Special Move ${index + 1}`,
          value: move
        }))
      ],
      properties: {
        evolution_path: this.getDominantBehavior(behaviorScores).primary,
        visual_traits: evolutionData.visualTraits,
        battle_history: `${creature.wins}W-${creature.battleCount - creature.wins}L`
      }
    };
  }

  // Generate evolution image URL (placeholder - would use AI image generation)
  generateEvolutionImageUrl(creature, evolutionData) {
    // In production, this would call an AI image generation service
    // For now, return a dynamic SVG URL based on traits
    const params = new URLSearchParams({
      seed: `${creature.element}-${evolutionData.name}`,
      backgroundColor: this.getColorHex(evolutionData.visualTraits.color),
      size: evolutionData.visualTraits.size
    });
    
    return `https://api.dicebear.com/7.x/shapes/svg?${params}`;
  }

  getColorHex(colorName) {
    const colors = {
      crimson: 'dc143c',
      darkred: '8b0000',
      silver: 'c0c0c0',
      platinum: 'e5e4e2',
      purple: '800080',
      violet: 'ee82ee',
      gold: 'ffd700',
      rainbow: 'ff00ff',
      iridescent: '00ffff',
      prismatic: 'ffffff'
    };
    return colors[colorName] || 'ffffff';
  }
}

// Export singleton instance
export const behaviorAnalyzer = new BehaviorAnalyzer();