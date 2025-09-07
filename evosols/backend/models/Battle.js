// backend/models/Battle.js
import mongoose from 'mongoose';

const battleSchema = new mongoose.Schema({
  battleId: {
    type: String,
    required: true,
    unique: true,
  },
  player1: {
    address: {
      type: String,
      required: true,
    },
    creatureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creature',
    },
    ready: {
      type: Boolean,
      default: false,
    },
  },
  player2: {
    address: {
      type: String,
      required: true,
    },
    creatureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creature',
    },
    ready: {
      type: Boolean,
      default: false,
    },
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'abandoned'],
    default: 'waiting',
  },
  moves: [{
    player: String,
    move: {
      type: String,
      enum: ['attack', 'defend', 'special', 'ultimate'],
    },
    damage: Number,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  winner: {
    type: String,
    default: null,
  },
  behaviorData: {
    player1: {
      aggressive: { type: Number, default: 0 },
      defensive: { type: Number, default: 0 },
      strategic: { type: Number, default: 0 },
      risky: { type: Number, default: 0 },
      adaptive: { type: Number, default: 0 },
    },
    player2: {
      aggressive: { type: Number, default: 0 },
      defensive: { type: Number, default: 0 },
      strategic: { type: Number, default: 0 },
      risky: { type: Number, default: 0 },
      adaptive: { type: Number, default: 0 },
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
});

const Battle = mongoose.model('Battle', battleSchema);

export default Battle;