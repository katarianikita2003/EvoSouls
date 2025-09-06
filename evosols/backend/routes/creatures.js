import express from 'express';
import { Creature } from '../models/Creature.js';

const router = express.Router();

// Create new creature (after minting)
router.post('/', async (req, res) => {
  try {
    const { tokenId, contractAddress, owner, name, element, metadataURI, imageURL, transactionHash } = req.body;
    
    // Check if creature already exists
    const existing = await Creature.findOne({ tokenId, contractAddress });
    if (existing) {
      return res.status(400).json({ error: 'Creature already exists' });
    }
    
    // Set initial stats based on element
    let initialStats;
    let moves;
    
    switch(element) {
      case 'fire':
        initialStats = {
          attack: 80, defense: 40, speed: 60, intelligence: 50,
          hp: 100, maxHp: 100, energy: 100, maxEnergy: 100
        };
        moves = [
          { id: 'savage_strike', name: 'Savage Strike', type: 'attack', power: 120, energyCost: 30, unlockLevel: 1 },
          { id: 'power_attack', name: 'Power Attack', type: 'attack', power: 80, energyCost: 20, unlockLevel: 1 },
          { id: 'berserker_rage', name: 'Berserker Rage', type: 'special', power: 150, energyCost: 50, unlockLevel: 5 }
        ];
        break;
      case 'water':
        initialStats = {
          attack: 60, defense: 60, speed: 50, intelligence: 60,
          hp: 120, maxHp: 120, energy: 100, maxEnergy: 100
        };
        moves = [
          { id: 'quick_strike', name: 'Quick Strike', type: 'attack', power: 50, energyCost: 10, unlockLevel: 1 },
          { id: 'healing_light', name: 'Healing Light', type: 'heal', power: 30, energyCost: 25, unlockLevel: 1 },
          { id: 'tactical_strike', name: 'Tactical Strike', type: 'special', power: 100, energyCost: 40, unlockLevel: 5 }
        ];
        break;
      case 'earth':
        initialStats = {
          attack: 40, defense: 80, speed: 30, intelligence: 70,
          hp: 150, maxHp: 150, energy: 100, maxEnergy: 100
        };
        moves = [
          { id: 'iron_wall', name: 'Iron Wall', type: 'defend', power: 0, energyCost: 20, unlockLevel: 1 },
          { id: 'counter_stance', name: 'Counter Stance', type: 'counter', power: 0, energyCost: 15, unlockLevel: 1 },
          { id: 'energy_burst', name: 'Energy Burst', type: 'special', power: 80, energyCost: 0, unlockLevel: 5 }
        ];
        break;
      default:
        return res.status(400).json({ error: 'Invalid element' });
    }
    
    const creature = new Creature({
      tokenId,
      contractAddress,
      owner: owner.toLowerCase(),
      name,
      element,
      stats: initialStats,
      moves,
      metadataURI,
      imageURL
    });
    
    await creature.save();
    res.json({ success: true, creature });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get creature by token ID
router.get('/:tokenId', async (req, res) => {
  try {
    const creature = await Creature.findOne({ tokenId: req.params.tokenId });
    if (!creature) {
      return res.status(404).json({ error: 'Creature not found' });
    }
    res.json(creature);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all creatures by owner
router.get('/user/:address', async (req, res) => {
  try {
    const creatures = await Creature.find({ 
      owner: req.params.address.toLowerCase() 
    }).sort('-createdAt');
    res.json(creatures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update creature metadata (after evolution)
router.put('/:tokenId/metadata', async (req, res) => {
  try {
    const { metadataURI, imageURL } = req.body;
    const creature = await Creature.findOne({ tokenId: req.params.tokenId });
    
    if (!creature) {
      return res.status(404).json({ error: 'Creature not found' });
    }
    
    creature.metadataURI = metadataURI;
    creature.imageURL = imageURL;
    await creature.save();
    
    res.json({ success: true, creature });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Evolve creature
router.post('/:tokenId/evolve', async (req, res) => {
  try {
    const creature = await Creature.findOne({ tokenId: req.params.tokenId });
    
    if (!creature) {
      return res.status(404).json({ error: 'Creature not found' });
    }
    
    if (!creature.isEvolvable) {
      return res.status(400).json({ error: 'Creature not ready for evolution' });
    }
    
    // Determine next evolution stage
    let nextStage;
    if (creature.evolutionStage === 'Base') {
      nextStage = 'Evolved';
    } else if (creature.evolutionStage === 'Evolved') {
      nextStage = 'Ultimate';
    } else {
      return res.status(400).json({ error: 'Already at maximum evolution' });
    }
    
    // Get dominant behavior
    const dominantBehavior = creature.getDominantBehavior();
    
    // Apply evolution bonuses based on behavior
    const bonusMultiplier = nextStage === 'Evolved' ? 1 : 2;
    
    switch(dominantBehavior) {
      case 'aggressive':
        creature.stats.attack += 25 * bonusMultiplier;
        creature.stats.speed += 10 * bonusMultiplier;
        creature.stats.maxHp += 10 * bonusMultiplier;
        break;
      case 'defensive':
        creature.stats.defense += 25 * bonusMultiplier;
        creature.stats.maxHp += 30 * bonusMultiplier;
        creature.stats.intelligence += 10 * bonusMultiplier;
        break;
      case 'strategic':
        creature.stats.intelligence += 20 * bonusMultiplier;
        creature.stats.attack += 10 * bonusMultiplier;
        creature.stats.defense += 10 * bonusMultiplier;
        creature.stats.maxEnergy += 20 * bonusMultiplier;
        break;
      case 'risky':
        creature.stats.attack += 20 * bonusMultiplier;
        creature.stats.speed += 20 * bonusMultiplier;
        creature.stats.defense -= 5 * bonusMultiplier;
        break;
      case 'adaptive':
        creature.stats.attack += 10 * bonusMultiplier;
        creature.stats.defense += 10 * bonusMultiplier;
        creature.stats.speed += 10 * bonusMultiplier;
        creature.stats.intelligence += 15 * bonusMultiplier;
        creature.stats.maxHp += 20 * bonusMultiplier;
        creature.stats.maxEnergy += 10 * bonusMultiplier;
        break;
    }
    
    // Update creature
    creature.evolutionStage = nextStage;
    creature.isEvolvable = false;
    creature.stats.hp = creature.stats.maxHp;
    creature.stats.energy = creature.stats.maxEnergy;
    
    await creature.save();
    
    res.json({ 
      success: true, 
      creature,
      evolutionData: {
        stage: nextStage,
        dominantBehavior,
        newStats: creature.stats
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard/:filter', async (req, res) => {
  try {
    const { filter } = req.params;
    const { limit = 100 } = req.query;
    
    let sortCriteria;
    switch(filter) {
      case 'wins':
        sortCriteria = { 'battleStats.wins': -1 };
        break;
      case 'winRate':
        sortCriteria = { 'battleStats.winRate': -1 };
        break;
      case 'level':
        sortCriteria = { level: -1, experience: -1 };
        break;
      case 'battles':
        sortCriteria = { 'battleStats.totalBattles': -1 };
        break;
      default:
        sortCriteria = { 'battleStats.wins': -1, level: -1 };
    }
    
    const creatures = await Creature.find({})
      .sort(sortCriteria)
      .limit(parseInt(limit))
      .select('name owner element level evolutionStage battleStats');
    
    const leaderboard = creatures.map((creature, index) => ({
      rank: index + 1,
      creature: {
        name: creature.name,
        owner: creature.owner,
        element: creature.element,
        level: creature.level,
        evolutionStage: creature.evolutionStage
      },
      stats: creature.battleStats
    }));
    
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;