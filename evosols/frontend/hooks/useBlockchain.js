// hooks/useBlockchain.js
import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import EvoSoulsABI from '../contracts/EvoSoulsABI.json';

// Get API URL with fallback
const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  // Remove trailing slash if present
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const API_URL = getApiUrl();
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const useBlockchain = () => {
  const { address, isConnected } = useAccount();
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Contract interactions (only if not in demo mode and contract is deployed)
  const { data: mintPrice } = useContractRead({
    address: CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' ? CONTRACT_ADDRESS : undefined,
    abi: EvoSoulsABI,
    functionName: 'mintPrice',
    enabled: !DEMO_MODE && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  const { writeAsync: mintCreatureContract } = useContractWrite({
    address: CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000' ? CONTRACT_ADDRESS : undefined,
    abi: EvoSoulsABI,
    functionName: 'mintCreature',
    enabled: !DEMO_MODE && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  // Mint creature function
  const mintCreature = async (creatureType, name) => {
    try {
      setLoading(true);
      setError(null);

      if (!address) {
        throw new Error('Wallet not connected');
      }

      console.log('Minting creature:', { creatureType, name, address, API_URL });

      // Create creature in database first
      const response = await fetch(`${API_URL}/api/creatures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: address,
          name,
          element: creatureType,
          demoMode: DEMO_MODE,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to create creature: ${response.status}`);
      }

      const creatureData = await response.json();
      console.log('Creature created in database:', creatureData);

      // If not in demo mode and contract is deployed, mint on blockchain
      if (!DEMO_MODE && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        try {
          const tx = await mintCreatureContract({
            args: [creatureData.tokenId, creatureData.tokenURI],
            value: mintPrice || parseEther('0.01'),
          });

          console.log('Blockchain transaction:', tx);
          
          // Update creature with transaction hash
          await fetch(`${API_URL}/api/creatures/${creatureData._id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transactionHash: tx.hash,
              status: 'minted',
            }),
          });
        } catch (blockchainError) {
          console.error('Blockchain minting failed:', blockchainError);
          // Continue anyway in demo mode
          if (!DEMO_MODE) {
            throw blockchainError;
          }
        }
      }

      // Refresh creatures list
      await fetchUserCreatures();
      
      return creatureData;
    } catch (err) {
      console.error('Minting error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user creatures
  const fetchUserCreatures = useCallback(async () => {
    if (!address) {
      setCreatures([]);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching creatures for:', address, 'from:', `${API_URL}/api/creatures/user/${address}`);
      
      const response = await fetch(`${API_URL}/api/creatures/user/${address}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No creatures found for user');
          setCreatures([]);
          return;
        }
        throw new Error(`Failed to fetch creatures: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched creatures:', data);
      setCreatures(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching creatures:', err);
      setError(err.message);
      setCreatures([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Update creature metadata
  const updateCreatureMetadata = async (creatureId, metadata) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/creatures/${creatureId}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error('Failed to update metadata');
      }

      const updatedCreature = await response.json();
      
      // Update local state
      setCreatures(prev => 
        prev.map(c => c._id === creatureId ? updatedCreature : c)
      );

      return updatedCreature;
    } catch (err) {
      console.error('Error updating metadata:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Battle functions
  const startBattle = async (creatureId, opponentAddress) => {
    try {
      const response = await fetch(`${API_URL}/api/battles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatureId,
          playerAddress: address,
          opponentAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start battle');
      }

      return await response.json();
    } catch (err) {
      console.error('Error starting battle:', err);
      setError(err.message);
      throw err;
    }
  };

  // Fetch creatures on mount and address change
  useEffect(() => {
    if (address) {
      fetchUserCreatures();
    }
  }, [address, fetchUserCreatures]);

  // Log environment info on mount
  useEffect(() => {
    console.log('Blockchain hook initialized:', {
      API_URL,
      CONTRACT_ADDRESS,
      DEMO_MODE,
      isConnected,
      address,
    });
  }, []);

  return {
    // State
    address,
    isConnected,
    creatures,
    loading,
    error,
    
    // Functions
    mintCreature,
    fetchUserCreatures,
    updateCreatureMetadata,
    startBattle,
    refreshCreatures: fetchUserCreatures, // Alias for backward compatibility
    
    // Contract data
    mintPrice: DEMO_MODE ? parseEther('0') : (mintPrice || parseEther('0.01')),
    contractAddress: CONTRACT_ADDRESS,
    demoMode: DEMO_MODE,
  };
};