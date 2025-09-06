// scripts/setupMongoDB.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Schemas
const creatureSchema = new mongoose.Schema({
  tokenId: { type: String, unique: true, required: true },
  contractAddress: String,
  owner: { type: String, required: true, index: true },
  name: { type: String, required: true },
  element: { type: String, enum: ['fire', 'water', 'earth'], required: true },
  level: { type: Number, default: 1 },
  evolutionStage: { type: String, default: 'Base' },
  stats: {
    attack: { type: Number, default: 50 },
    defense: { type: Number, default: 50 },
    speed: { type: Number, default: 50 },
    intelligence: { type: Number, default: 50 }
  },
  behavior: {
    aggressive: { type: Number, default: 0 },
    defensive: { type: Number, default: 0 },
    strategic: { type: Number, default: 0 },
    risky: { type: Number, default: 0 },
    adaptive: { type: Number, default: 0 }
  },
  battleCount: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastBattle: Date,
  metadata: {
    image: String,
    attributes: [Object]
  }
});

const battleSchema = new mongoose.Schema({
  battleId: { type: String, unique: true },
  players: [{
    address: String,
    creatureId: String,
    creature: Object
  }],
  winner: String,
  loser: String,
  moves: [{
    turn: Number,
    player: String,
    move: Object,
    damage: Number,
    timestamp: Date
  }],
  behaviorData: Object,
  duration: Number,
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  address: { type: String, unique: true, required: true },
  username: String,
  creatures: [{ type: String, ref: 'Creature' }],
  stats: {
    totalBattles: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    favoriteElement: String
  },
  achievements: [String],
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

async function setupDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evosouls', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Create indexes
    const Creature = mongoose.model('Creature', creatureSchema);
    const Battle = mongoose.model('Battle', battleSchema);
    const User = mongoose.model('User', userSchema);
    
    // Create indexes for better performance
    await Creature.collection.createIndex({ owner: 1, element: 1 });
    await Creature.collection.createIndex({ level: -1, wins: -1 });
    await Battle.collection.createIndex({ createdAt: -1 });
    await Battle.collection.createIndex({ 'players.address': 1 });
    
    console.log('✅ Indexes created');
    
    // Create sample data for testing
    if (process.env.NODE_ENV === 'development') {
      const sampleCreature = await Creature.create({
        tokenId: 'demo-001',
        owner: '0x0000000000000000000000000000000000000001',
        name: 'Demo Phoenix',
        element: 'fire',
        stats: {
          attack: 80,
          defense: 40,
          speed: 60,
          intelligence: 50
        }
      });
      
      console.log('✅ Sample data created:', sampleCreature.name);
    }
    
    console.log('✅ MongoDB setup complete!');
    
  } catch (error) {
    console.error('❌ MongoDB setup error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run setup
setupDatabase();