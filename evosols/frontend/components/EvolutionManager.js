// frontend/components/EvolutionManager.js
import { useBlockchain } from '../hooks/useBlockchain';
import { useEffect, useState } from 'react';

export function EvolutionManager({ creature }) {
  const { evolveCreature } = useBlockchain();
  const [evolving, setEvolving] = useState(false);
  
  const handleEvolution = async () => {
    if (!creature.isEvolvable) return;
    
    setEvolving(true);
    
    // Prepare evolution data
    const evolutionData = {
      tokenId: creature.tokenId,
      originalName: creature.name,
      element: creature.element,
      stage: getNextStage(creature.stage),
      level: creature.level,
      battleCount: creature.battleCount,
      dominantBehavior: getDominantBehavior(creature.behavior),
      stats: creature.stats
    };
    
    try {
      await evolveCreature(creature.tokenId, evolutionData);
      // Show evolution animation
      showEvolutionAnimation();
    } catch (error) {
      console.error('Evolution failed:', error);
    } finally {
      setEvolving(false);
    }
  };
  
  // Evolution UI and animation...
}