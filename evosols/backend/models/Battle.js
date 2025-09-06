import mongoose from 'mongoose';

const BattleSchema = new mongoose.Schema({
  battleId: { type: String, required: true, unique: true },
  player1: {
    address: { type: String, required: true },
    creatureId: { type: String, required: true },
    creature: { type: mongoose.Schema.Types.ObjectId, ref: 'Creature' }
  },
  player2: {
    address: { type: String, required: true },
    creatureId: { type: String, required: true },
    creature: { type: mongoose.Schema.Types.ObjectId, ref: 'Creature' }
  },
  
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'abandoned'],
    default: 'pending'
  },
  
  battleLog: [{
    turn: Number,
    player: String,
    move: {
      id: String,
      name: String,
      type: String,
      power: Number,
      energyCost: Number
    },
    damage: Number,
    healing: Number,
    effect: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  behaviorChanges: {
    player1: {
      aggressive: { type: Number, default: 0 },
      defensive: { type: Number, default: 0 },
      strategic: { type: Number, default: 0 },
      risky: { type: Number, default: 0 },
      adaptive: { type: Number, default: 0 }
    },
    player2: {
      aggressive: { type: Number, default: 0 },
      defensive: { type: Number, default: 0 },
      strategic: { type: Number, default: 0 },
      risky: { type: Number, default: 0 },
      adaptive: { type: Number, default: 0 }
    }
  },
  
  result: {
    winner: String,
    loser: String,
    isDraw: { type: Boolean, default: false }
  },
  
  rewards: {
    winner: {
      experience: Number,
      matic: Number
    },
    loser: {
      experience: Number,
      matic: Number
    }
  },
  
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  totalTurns: { type: Number, default: 0 },
  duration: Number // in seconds
});

export const Battle = mongoose.model('Battle', BattleSchema);