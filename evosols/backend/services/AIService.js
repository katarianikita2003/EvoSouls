// backend/services/AIService.js
export class AIService {
  analyzeBattleBehavior(moveHistory) {
    const behavior = {
      aggressive: 0,
      defensive: 0,
      strategic: 0,
      risky: 0,
      adaptive: 0
    };
    
    moveHistory.forEach((move, index) => {
      // Analyze aggression
      if (move.type === 'attack' && move.power > 100) {
        behavior.aggressive += 3;
      }
      
      // Analyze defense
      if (move.type === 'defend') {
        behavior.defensive += 2;
      }
      
      // Analyze risk-taking
      if (move.type === 'special' && move.creature.hp < 30) {
        behavior.risky += 4;
      }
      
      // Analyze strategy
      if (this.isCounterMove(move, moveHistory[index - 1])) {
        behavior.strategic += 2;
      }
      
      // Analyze adaptability
      const uniqueMoves = new Set(moveHistory.map(m => m.id)).size;
      behavior.adaptive = Math.min(uniqueMoves * 2, 10);
    });
    
    return this.normalizeBehavior(behavior);
  }
  
  getDominantBehavior(behavior) {
    return Object.entries(behavior)
      .reduce((a, b) => b[1] > a[1] ? b : a)[0];
  }
}