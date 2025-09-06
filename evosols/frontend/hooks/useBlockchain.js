// frontend/hooks/useBlockchain.js
import { useState, useEffect } from 'react';
import { useAccount, useNetwork, useContract, useContractRead, useContractWrite } from 'wagmi';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import verbwireClient from '../utils/verbwireClient';

const CONTRACT_ABI = [
  "function mintCreature(string memory _name, string memory _element) public payable",
  "function getCreature(uint256 _tokenId) public view returns (tuple(string name, string element, uint256 level, uint256 battleCount, uint256 wins, string evolutionStage, uint256 mintedAt, uint256 lastBattleTime))",
  "function getUserCreatures(address _owner) public view returns (uint256[] memory)",
  "function updateBattleStats(uint256 _tokenId, bool _won) public",
  "function evolveCreature(uint256 _tokenId, string memory _newStage) public",
  "function MINT_PRICE() public view returns (uint256)"
];

export function useBlockchain() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [creatures, setCreatures] = useState([]);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const isValidChain = chain?.id === parseInt(process.env.NEXT_PUBLIC_CHAIN_ID);

  // Demo mode check
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !contractAddress || contractAddress === '0x0000000000000000000000000000000000000000';

  // Mint creature function
  const mintCreature = async (creatureData) => {
    setLoading(true);
    
    try {
      if (isDemoMode) {
        // Demo mode: Use Verbwire API directly
        toast.loading('Minting your creature...');
        
        const metadata = {
          name: creatureData.name,
          description: `A ${creatureData.element} creature in the EvoSouls universe`,
          element: creatureData.element,
          level: 1,
          stats: creatureData.stats,
          evolutionStage: 'Base'
        };
        
        // Simulate minting delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create creature in backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creatures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...metadata,
            owner: address,
            tokenId: `demo-${Date.now()}`
          })
        });
        
        if (!response.ok) throw new Error('Failed to create creature');
        
        const result = await response.json();
        toast.success('Creature minted successfully!');
        
        return result.creature;
      } else {
        // Production mode: Use smart contract
        if (!isValidChain) {
          toast.error('Please switch to Polygon network');
          return;
        }
        
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
        
        const mintPrice = await contract.MINT_PRICE();
        const tx = await contract.mintCreature(creatureData.name, creatureData.element, {
          value: mintPrice
        });
        
        toast.loading('Minting on blockchain...');
        const receipt = await tx.wait();
        
        // Get token ID from event
        const mintEvent = receipt.events?.find(e => e.event === 'CreatureMinted');
        const tokenId = mintEvent?.args?.tokenId?.toString();
        
        // Upload metadata to IPFS via Verbwire
        const metadata = {
          name: creatureData.name,
          description: `A ${creatureData.element} creature in the EvoSouls universe`,
          element: creatureData.element,
          level: 1,
          stats: creatureData.stats,
          evolutionStage: 'Base',
          tokenId,
          contractAddress
        };
        
        await verbwireClient.mintNFT(address, metadata);
        
        toast.success('Creature minted successfully!');
        return { ...metadata, tokenId };
      }
    } catch (error) {
      console.error('Minting error:', error);
      toast.error('Failed to mint creature');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user creatures
  const fetchUserCreatures = async () => {
    if (!address) return;
    
    setLoading(true);
    
    try {
      if (isDemoMode) {
        // Fetch from backend API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creatures/user/${address}`);
        const data = await response.json();
        setCreatures(data || []);
      } else {
        // Fetch from blockchain
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
        
        const tokenIds = await contract.getUserCreatures(address);
        const creaturePromises = tokenIds.map(async (tokenId) => {
          const creature = await contract.getCreature(tokenId);
          return {
            tokenId: tokenId.toString(),
            name: creature.name,
            element: creature.element,
            level: creature.level.toNumber(),
            battleCount: creature.battleCount.toNumber(),
            wins: creature.wins.toNumber(),
            evolutionStage: creature.evolutionStage
          };
        });
        
        const userCreatures = await Promise.all(creaturePromises);
        setCreatures(userCreatures);
      }
    } catch (error) {
      console.error('Error fetching creatures:', error);
      toast.error('Failed to load creatures');
    } finally {
      setLoading(false);
    }
  };

  // Update battle stats
  const updateBattleStats = async (tokenId, won) => {
    try {
      if (isDemoMode) {
        // Update via API
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creatures/update-stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatureId: tokenId,
            battleCount: 1,
            wins: won ? 1 : 0
          })
        });
      } else {
        // Update on blockchain
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
        
        const tx = await contract.updateBattleStats(tokenId, won);
        await tx.wait();
      }
    } catch (error) {
      console.error('Error updating battle stats:', error);
      throw error;
    }
  };

  // Evolve creature
  const evolveCreature = async (tokenId, newStage, metadata) => {
    try {
      if (isDemoMode) {
        // Update metadata via Verbwire
        await verbwireClient.updateNFTMetadata(tokenId, contractAddress, metadata);
      } else {
        // Update on blockchain
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
        
        const tx = await contract.evolveCreature(tokenId, newStage);
        await tx.wait();
        
        // Update metadata on IPFS
        await verbwireClient.updateNFTMetadata(tokenId, contractAddress, metadata);
      }
      
      toast.success('Creature evolved!');
    } catch (error) {
      console.error('Error evolving creature:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchUserCreatures();
    }
  }, [address, isConnected]);

  return {
    address,
    isConnected,
    isDemoMode,
    loading,
    creatures,
    mintCreature,
    fetchUserCreatures,
    updateBattleStats,
    evolveCreature
  };
}