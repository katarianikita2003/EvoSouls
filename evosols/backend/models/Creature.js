import mongoose from 'mongoose';

const CreatureSchema = new mongoose.Schema({
  tokenId: { type: String, required: true, unique: true },
  contractAddress: { type: String, required: true },
  owner: { type: String, required: true, lowercase: true },
  name: { type: String, required: true },
  element: { type: String, enum: ['fire', 'water', 'earth'], required: true },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  evolutionStage: { 
    type: String, 
    enum: ['Base', 'Evolved', 'Ultimate'], 
    default: 'Base' 
  },
  
  stats: {
    attack: { type: Number, required: true },
    defense: { type: Number, required: true },
    speed: { type: Number, required: true },
    intelligence: { type: Number, required: true },
    hp: { type: Number, required: true },
    maxHp: { type: Number, required: true },
    energy: { type: Number, default: 100 },
    maxEnergy: { type: Number, default: 100 }
  },
  
  behavior: {
    aggressive: { type: Number, default: 0 },
    defensive: { type: Number, default: 0 },
    strategic: { type: Number, default: 0 },
    risky: { type: Number, default: 0 },
    adaptive: { type: Number, default: 0 }
  },
  
  battleStats: {
    totalBattles: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 }
  },
  
  moves: [{
    id: String,
    name: String,
    type: String,
    power: Number,
    energyCost: Number,
    unlockLevel: Number
  }],
  
  metadataURI: String,
  imageURL: String,
  isEvolvable: { type: Boolean, default: false },
  lastBattleTime: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Methods
CreatureSchema.methods.calculateWinRate = function() {
  if (this.battleStats.totalBattles === 0) return 0;
  return Math.round((this.battleStats.wins / this.battleStats.totalBattles) * 100);
};

CreatureSchema.methods.checkEvolution = function() {
  if (this.evolutionStage === 'Base' && this.battleStats.totalBattles >= 10) {
    this.isEvolvable = true;
  } else if (this.evolutionStage === 'Evolved' && this.battleStats.totalBattles >= 20) {
    this.isEvolvable = true;
  }
  return this.isEvolvable;
};

CreatureSchema.methods.addExperience = function(amount) {
  this.experience += amount;
  const requiredExp = this.level * 100;
  
  if (this.experience >= requiredExp) {
    this.level += 1;
    this.experience -= requiredExp;
    
    // Stat boost on level up
    this.stats.attack += 5;
    this.stats.defense += 5;
    this.stats.speed += 3;
    this.stats.intelligence += 3;
    this.stats.maxHp += 20;
    this.stats.hp = this.stats.maxHp;
    this.stats.maxEnergy += 10;
    this.stats.energy = this.stats.maxEnergy;
    
    return true; // Leveled up
  }
  return false;
};

CreatureSchema.methods.getDominantBehavior = function() {
  const behaviors = this.behavior.toObject();
  delete behaviors._id;
  
  let dominant = 'adaptive';
  let highestScore = 0;
  
  for (const [trait, score] of Object.entries(behaviors)) {
    if (score > highestScore) {
      highestScore = score;
      dominant = trait;
    }
  }
  
  return dominant;
};

// Hooks
CreatureSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.battleStats.winRate = this.calculateWinRate();
  next();
});

export const Creature = mongoose.model('Creature', CreatureSchema);