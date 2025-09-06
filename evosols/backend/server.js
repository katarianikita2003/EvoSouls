import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Import routes
import creatureRoutes from './routes/creatures.js';
import battleRoutes from './routes/battles.js';
import userRoutes from './routes/users.js';

// Import services
import { BattleService } from './services/BattleService.js';

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

// MongoDB connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evosols', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => {
//   console.log('Connected to MongoDB');
// }).catch(err => {
//   console.error('MongoDB connection error:', err);
// });

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Initialize services
const battleService = new BattleService();

// Routes
app.use('/api/creatures', creatureRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Socket.io for real-time battles
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Join battle room
  socket.on('joinBattle', async (data) => {
    try {
      const battle = await battleService.createBattle(
        data.player1,
        data.player2
      );
      
      socket.join(battle.battleId);
      io.to(battle.battleId).emit('battleStarted', battle);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Execute move
  socket.on('executeMove', async (data) => {
    try {
      const result = await battleService.executeMove(
        data.battleId,
        data.playerAddress,
        data.move
      );
      
      io.to(data.battleId).emit('moveExecuted', result);
      
      // Check if battle ended
      if (result.battleEnd) {
        io.to(data.battleId).emit('battleEnded', result);
        // Clean up room after delay
        setTimeout(() => {
          io.in(data.battleId).socketsLeave(data.battleId);
        }, 5000);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    battleService.handleDisconnect(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io ready for real-time battles`);
});