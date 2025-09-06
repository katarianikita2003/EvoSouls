import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Simple user registry (optional for enhanced features)
const users = new Map();

// Register wallet address
router.post('/register', async (req, res) => {
  try {
    const { address, username } = req.body;
    
    if (users.has(address.toLowerCase())) {
      return res.status(400).json({ error: 'Address already registered' });
    }
    
    users.set(address.toLowerCase(), {
      username,
      registeredAt: new Date(),
      lastSeen: new Date()
    });
    
    const token = jwt.sign(
      { address: address.toLowerCase() },
      process.env.JWT_SECRET || 'evosols-secret-key',
      { expiresIn: '30d' }
    );
    
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user info
router.get('/:address', async (req, res) => {
  try {
    const user = users.get(req.params.address.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;