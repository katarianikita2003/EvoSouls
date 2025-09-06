// backend/server.js
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import battleSocketHandler from './socketHandlers/battleSocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection (optional - can use in-memory for hackathon)
const useDatabase = process.env.MONGODB_URI ? true : false;
if (useDatabase) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

// In-memory database for demo
const mockDatabase = {
  creatures: new Map(),
  users: new Map(),
  battles: [],
  leaderboard: []
};

// Creature Schema (for reference)
const creatureSchema = {
  tokenId: String,
  contractAddress: String,
  owner: String,
  name: String,
  element: String,
  level: Number,
  evolutionStage: String,
  stats: {
    attack: Number,
    defense: Number,
    speed: Number,
    intelligence: Number
  },
  behavior: {
    aggressive: Number,
    defensive: Number,
    strategic: Number,
    risky: Number,
    adaptive: Number
  },
  battleCount: Number,
  wins: Number,
  createdAt: Date,
  lastBattle: Date
};

// Socket.io battle handlers
battleSocketHandler(io);

// API Routes

// Create/Register a new creature
app.post('/api/creatures', (req, res) => {
  const creature = {
    ...req.body,
    tokenId: `demo-${Date.now()}`,
    createdAt: new Date(),
    battleCount: 0,
    wins: 0,
    behavior: {
      aggressive: 0,
      defensive: 0,
      strategic: 0,
      risky: 0,
      adaptive: 0
    }
  };
  
  mockDatabase.creatures.set(creature.tokenId, creature);
  
  // Update user's creatures
  const userCreatures = mockDatabase.users.get(creature.owner) || [];
  userCreatures.push(creature.tokenId);
  mockDatabase.users.set(creature.owner, userCreatures);
  
  res.json({ success: true, creature });
});

// Get creature by ID
app.get('/api/creatures/:tokenId', (req, res) => {
  const creature = mockDatabase.creatures.get(req.params.tokenId);
  if (!creature) {
    return res.status(404).json({ error: 'Creature not found' });
  }
  res.json(creature);
});

// Get user's creatures
app.get('/api/creatures/user/:address', (req, res) => {
  const userCreatureIds = mockDatabase.users.get(req.params.address) || [];
  const creatures = userCreatureIds.map(id => mockDatabase.creatures.get(id)).filter(Boolean);
  res.json(creatures);
});

// Update creature stats after battle
app.post('/api/creatures/update-stats', (req, res) => {
  const { creatureId, battleCount, wins, behaviorUpdate } = req.body;
  const creature = mockDatabase.creatures.get(creatureId);
  
  if (!creature) {
    return res.status(404).json({ error: 'Creature not found' });
  }
  
  // Update battle stats
  creature.battleCount += battleCount;
  creature.wins += wins;
  creature.lastBattle = new Date();
  
  // Update behavior
  Object.keys(behaviorUpdate).forEach(key => {
    creature.behavior[key] = (creature.behavior[key] || 0) + behaviorUpdate[key];
  });
  
  // Check for level up (every 5 wins)
  if (creature.wins > 0 && creature.wins % 5 === 0) {
    creature.level += 1;
    
    // Boost stats on level up
    creature.stats.attack += 5;
    creature.stats.defense += 5;
    creature.stats.speed += 3;
    creature.stats.intelligence += 3;
  }
  
  // Check for evolution
  if (creature.battleCount >= 10 && creature.evolutionStage === 'Base') {
    creature.evolutionStage = 'Evolved';
  } else if (creature.battleCount >= 20 && creature.evolutionStage === 'Evolved') {
    creature.evolutionStage = 'Ultimate';
  }
  
  mockDatabase.creatures.set(creatureId, creature);
  
  // Update leaderboard
  updateLeaderboard();
  
  res.json({ success: true, creature });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  const { filter = 'overall', timeframe = 'all' } = req.query;
  
  let creatures = Array.from(mockDatabase.creatures.values());
  
  // Filter by timeframe
  if (timeframe !== 'all') {
    const now = new Date();
    const timeFilters = {
      today: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = new Date(now - timeFilters[timeframe]);
    creatures = creatures.filter(c => c.lastBattle && new Date(c.lastBattle) > cutoff);
  }
  
  // Calculate scores and sort
  const leaderboard = creatures.map(creature => {
    const winRate = creature.battleCount > 0 ? (creature.wins / creature.battleCount) * 100 : 0;
    
    let score = 0;
    switch (filter) {
      case 'winRate':
        score = winRate * (creature.battleCount >= 10 ? 1 : 0.5); // Penalize low battle counts
        break;
      case 'battles':
        score = creature.battleCount;
        break;
      case 'evolution':
        score = (creature.evolutionStage === 'Ultimate' ? 1000 : 
                creature.evolutionStage === 'Evolved' ? 500 : 0) + creature.level;
        break;
      default: // overall
        score = (creature.wins * 10) + (winRate * 5) + (creature.level * 20);
    }
    
    return {
      address: creature.owner,
      creature: {
        name: creature.name,
        element: creature.element,
        level: creature.level,
        evolutionStage: creature.evolutionStage
      },
      stats: {
        battles: creature.battleCount,
        wins: creature.wins,
        winRate: Math.round(winRate)
      },
      score: Math.round(score)
    };
  });
  
  // Sort by score
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Limit to top 100
  res.json(leaderboard.slice(0, 100));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'demo' });
});

// Helper function to update leaderboard
function updateLeaderboard() {
  // This would be more sophisticated in production
  // For now, it's handled in the GET request
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io ready for real-time battles`);
});