// backend/models/Creature.js
import mongoose from 'mongoose';

const creatureSchema = new mongoose.Schema({
  tokenId: {
    type: Number,
    required: true,
    unique: true,
  },
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  element: {
    type: String,
    required: true,
    enum: ['fire', 'water', 'earth'],
  },
  level: {
    type: Number,
    default: 1,
  },
  experience: {
    type: Number,
    default: 0,
  },
  battles: {
    type: Number,
    default: 0,
  },
  wins: {
    type: Number,
    default: 0,
  },
  stats: {
    health: {
      type: Number,
      default: 100,
    },
    attack: {
      type: Number,
      default: 10,
    },
    defense: {
      type: Number,
      default: 10,
    },
    speed: {
      type: Number,
      default: 10,
    },
  },
  behavior: {
    aggressive: {
      type: Number,
      default: 0,
    },
    defensive: {
      type: Number,
      default: 0,
    },
    strategic: {
      type: Number,
      default: 0,
    },
    risky: {
      type: Number,
      default: 0,
    },
    adaptive: {
      type: Number,
      default: 0,
    },
  },
  evolution: {
    stage: {
      type: Number,
      default: 0,
    },
    path: {
      type: String,
      default: null,
    },
  },
  tokenURI: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['demo', 'pending', 'minted'],
    default: 'demo',
  },
  transactionHash: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp on save
creatureSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Creature = mongoose.model('Creature', creatureSchema);

export default Creature;