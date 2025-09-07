// backend/server.js
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import Creature from './models/Creature.js';
import Battle from './models/Battle.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://evo-souls-mtzw0cba4-12214064-2448s-projects.vercel.app',
      'https://evo-souls.vercel.app',
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      console.log('Origin not allowed:', origin);
      callback(null, true); // For development, allow all origins
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO configuration
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'EvoSouls API is running',
    endpoints: {
      creatures: '/api/creatures',
      battles: '/api/battles',
      health: '/api/health',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// In-memory storage for demo mode
const inMemoryCreatures = new Map();
const inMemoryBattles = new Map();

// Creature Routes
app.get('/api/creatures', async (req, res) => {
  try {
    if (process.env.DEMO_MODE === 'true' || mongoose.connection.readyState !== 1) {
      const creatures = Array.from(inMemoryCreatures.values());
      return res.json(creatures);
    }
    
    const creatures = await Creature.find();
    res.json(creatures);
  } catch (error) {
    console.error('Error fetching creatures:', error);
    res.status(500).json({ error: 'Failed to fetch creatures' });
  }
});

app.get('/api/creatures/user/:address', async (req, res) => {
  try {
    const { address } = req.params;
    console.log('Fetching creatures for address:', address);
    
    if (process.env.DEMO_MODE === 'true' || mongoose.connection.readyState !== 1) {
      const userCreatures = Array.from(inMemoryCreatures.values())
        .filter(c => c.walletAddress.toLowerCase() === address.toLowerCase());
      
      if (userCreatures.length === 0) {
        return res.status(404).json({ message: 'No creatures found for this address' });
      }
      
      return res.json(userCreatures);
    }
    
    const creatures = await Creature.find({ 
      walletAddress: address.toLowerCase()
    });
    
    if (creatures.length === 0) {
      return res.status(404).json({ message: 'No creatures found for this address' });
    }
    
    res.json(creatures);
  } catch (error) {
    console.error('Error fetching user creatures:', error);
    res.status(500).json({ error: 'Failed to fetch user creatures' });
  }
});

app.post('/api/creatures', async (req, res) => {
  try {
    const { walletAddress, name, element, demoMode } = req.body;
    
    console.log('Creating creature:', { walletAddress, name, element, demoMode });
    
    if (!walletAddress || !name || !element) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const tokenId = Math.floor(Math.random() * 1000000);
    
    const creatureData = {
      tokenId,
      walletAddress: walletAddress.toLowerCase(),
      name,
      element,
      level: 1,
      experience: 0,
      battles: 0,
      wins: 0,
      stats: {
        health: 100,
        attack: element === 'fire' ? 15 : element === 'water' ? 12 : 10,
        defense: element === 'earth' ? 15 : element === 'water' ? 12 : 10,
        speed: element === 'fire' ? 12 : element === 'water' ? 15 : 10,
      },
      behavior: {
        aggressive: 0,
        defensive: 0,
        strategic: 0,
        risky: 0,
        adaptive: 0,
      },
      evolution: {
        stage: 0,
        path: null,
      },
      tokenURI: `https://evosouls.game/api/metadata/${element}-${tokenId}`,
      status: demoMode ? 'demo' : 'pending',
    };
    
    if (process.env.DEMO_MODE === 'true' || mongoose.connection.readyState !== 1) {
      const inMemoryCreature = {
        ...creatureData,
        _id: new Date().getTime().toString(),
        createdAt: new Date(),
      };
      inMemoryCreatures.set(inMemoryCreature._id, inMemoryCreature);
      console.log('Creature saved to memory:', inMemoryCreature);
      return res.status(201).json(inMemoryCreature);
    }
    
    const creature = new Creature(creatureData);
    await creature.save();
    
    res.status(201).json(creature);
  } catch (error) {
    console.error('Error creating creature:', error);
    res.status(500).json({ error: 'Failed to create creature', details: error.message });
  }
});

app.patch('/api/creatures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (process.env.DEMO_MODE === 'true' || mongoose.connection.readyState !== 1) {
      const creature = inMemoryCreatures.get(id);
      if (!creature) {
        return res.status(404).json({ error: 'Creature not found' });
      }
      
      Object.assign(creature, updates, { updatedAt: new Date() });
      inMemoryCreatures.set(id, creature);
      return res.json(creature);
    }
    
    const creature = await Creature.findByIdAndUpdate(
      id, 
      { ...updates, updatedAt: Date.now() }, 
      { new: true }
    );
    
    if (!creature) {
      return res.status(404).json({ error: 'Creature not found' });
    }
    
    res.json(creature);
  } catch (error) {
    console.error('Error updating creature:', error);
    res.status(500).json({ error: 'Failed to update creature' });
  }
});

// Battle Routes
app.post('/api/battles', async (req, res) => {
  try {
    const { creatureId, playerAddress, opponentAddress } = req.body;
    
    const battleId = `battle-${new Date().getTime()}`;
    
    const battleData = {
      battleId,
      player1: {
        address: playerAddress,
        creatureId,
        ready: false,
      },
      player2: {
        address: opponentAddress,
        creatureId: null,
        ready: false,
      },
      status: 'waiting',
      moves: [],
    };
    
    if (process.env.DEMO_MODE === 'true' || mongoose.connection.readyState !== 1) {
      const inMemoryBattle = {
        ...battleData,
        _id: new Date().getTime().toString(),
        createdAt: new Date(),
      };
      inMemoryBattles.set(inMemoryBattle._id, inMemoryBattle);
      return res.status(201).json(inMemoryBattle);
    }
    
    const battle = new Battle(battleData);
    await battle.save();
    
    res.status(201).json(battle);
  } catch (error) {
    console.error('Error creating battle:', error);
    res.status(500).json({ error: 'Failed to create battle' });
  }
});

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-battle', (data) => {
    const { battleId, playerAddress } = data;
    socket.join(battleId);
    console.log(`Player ${playerAddress} joined battle ${battleId}`);
    
    // Notify other players
    socket.to(battleId).emit('opponent-joined', {
      address: playerAddress,
    });
  });
  
  socket.on('battle-move', (data) => {
    const { battleId, move, playerAddress } = data;
    console.log(`Battle move in ${battleId}:`, move);
    
    // Broadcast move to other players
    socket.to(battleId).emit('opponent-move', {
      move,
      playerAddress,
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// MongoDB connection (optional for demo mode)
const connectDB = async () => {
  if (process.env.DEMO_MODE === 'true') {
    console.log('Running in DEMO MODE - using in-memory storage');
    return;
  }
  
  if (!process.env.MONGODB_URI) {
    console.log('No MongoDB URI provided - using in-memory storage');
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Falling back to in-memory storage');
  }
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS enabled for multiple origins`);
    console.log(`Demo mode: ${process.env.DEMO_MODE || 'false'}`);
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

export default app;