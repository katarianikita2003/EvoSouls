import express from 'express';
import { Battle } from '../models/Battle.js';
import { Creature } from '../models/Creature.js';

const router = express.Router();

// Get battle history for a creature
router.get('/creature/:tokenId', async (req, res) => {
  try {
    const battles = await Battle.find({
      $or: [
        { 'player1.creatureId': req.params.tokenId },
        { 'player2.creatureId': req.params.tokenId }
      ],
      status: 'completed'
    })
    .populate('player1.creature player2.creature')
    .sort('-endTime')
    .limit(50);
    
    res.json(battles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get battle history for a player
router.get('/player/:address', async (req, res) => {
  try {
    const battles = await Battle.find({
      $or: [
        { 'player1.address': req.params.address.toLowerCase() },
        { 'player2.address': req.params.address.toLowerCase() }
      ],
      status: 'completed'
    })
    .populate('player1.creature player2.creature')
    .sort('-endTime')
    .limit(100);
    
    res.json(battles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific battle details
router.get('/:battleId', async (req, res) => {
  try {
    const battle = await Battle.findOne({ battleId: req.params.battleId })
      .populate('player1.creature player2.creature');
    
    if (!battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }
    
    res.json(battle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get battle statistics
router.get('/stats/:address', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    
    const stats = await Battle.aggregate([
      {
        $match: {
          $or: [
            { 'player1.address': address },
            { 'player2.address': address }
          ],
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalBattles: { $sum: 1 },
          wins: {
            $sum: {
              $cond: [{ $eq: ['$result.winner', address] }, 1, 0]
            }
          },
          losses: {
            $sum: {
              $cond: [{ $eq: ['$result.loser', address] }, 1, 0]
            }
          },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalBattles: 0,
      wins: 0,
      losses: 0,
      totalDuration: 0,
      avgDuration: 0
    };
    
    result.winRate = result.totalBattles > 0 
      ? Math.round((result.wins / result.totalBattles) * 100) 
      : 0;
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;