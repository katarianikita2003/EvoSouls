import { useState, useEffect } from 'react';
import { BlockchainService } from '../utils/blockchain';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';

export function useBlockchain() {
  const { address, isConnected } = useAccount();
  const [blockchain, setBlockchain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creatures, setCreatures] = useState([]);

  useEffect(() => {
    if (isConnected && address) {
      const service = new BlockchainService();
      service.connect()
        .then(() => {
          setBlockchain(service);
          // Load user's creatures
          return service.getUserCreatures(address);
        })
        .then(userCreatures => {
          setCreatures(userCreatures);
        })
        .catch(err => {
          console.error('Blockchain connection failed:', err);
          toast.error('Failed to connect to blockchain');
        });
    }
  }, [isConnected, address]);

  const mintCreature = async (name, element, imageFile) => {
    if (!blockchain) throw new Error('Blockchain not connected');
    
    setLoading(true);
    const toastId = toast.loading('Minting your creature...');
    
    try {
      const result = await blockchain.mintCreature(name, element, imageFile);
      toast.success('Creature minted successfully!', { id: toastId });
      
      // Refresh creatures list
      const updatedCreatures = await blockchain.getUserCreatures(address);
      setCreatures(updatedCreatures);
      
      return result;
    } catch (error) {
      toast.error(error.message || 'Minting failed', { id: toastId });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const battle = async (attackerId, defenderId, moves) => {
    if (!blockchain) throw new Error('Blockchain not connected');
    
    setLoading(true);
    try {
      const result = await blockchain.battle(attackerId, defenderId, moves);
      return result;
    } catch (error) {
      toast.error(error.message || 'Battle transaction failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const evolveCreature = async (creature) => {
    if (!blockchain) throw new Error('Blockchain not connected');
    
    setLoading(true);
    const toastId = toast.loading('Evolving your creature...');
    
    try {
      // Get evolution data from backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/creatures/${creature.tokenId}/evolve`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error('Evolution preparation failed');
      }
      
      const { evolutionData } = await response.json();
      
      // Execute blockchain evolution
      const result = await blockchain.evolveCreature(creature.tokenId, {
        originalName: creature.name,
        element: creature.element,
        stage: evolutionData.stage,
        level: creature.level,
        battleCount: creature.battleStats.totalBattles,
        dominantBehavior: evolutionData.dominantBehavior,
        stats: evolutionData.newStats
      });
      
      toast.success('Evolution successful!', { id: toastId });
      
      // Refresh creatures
      const updatedCreatures = await blockchain.getUserCreatures(address);
      setCreatures(updatedCreatures);
      
      return result;
    } catch (error) {
      toast.error(error.message || 'Evolution failed', { id: toastId });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshCreatures = async () => {
    if (!blockchain || !address) return;
    
    try {
      const updatedCreatures = await blockchain.getUserCreatures(address);
      setCreatures(updatedCreatures);
    } catch (error) {
      console.error('Failed to refresh creatures:', error);
    }
  };

  return {
    blockchain,
    loading,
    creatures,
    mintCreature,
    battle,
    evolveCreature,
    refreshCreatures,
    address
  };
}