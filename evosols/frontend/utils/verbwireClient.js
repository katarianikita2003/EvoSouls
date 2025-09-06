// frontend/utils/verbwireClient.js
import axios from 'axios';

const VERBWIRE_API_KEY = process.env.NEXT_PUBLIC_VERBWIRE_API_KEY || 'sk_live_4626604f-7471-4481-9490-22c660995323';
const VERBWIRE_BASE_URL = 'https://api.verbwire.com/v1';

class VerbwireClient {
  constructor() {
    this.apiKey = VERBWIRE_API_KEY;
    this.baseURL = VERBWIRE_BASE_URL;
    this.headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async mintNFT(recipientAddress, metadata) {
    try {
      const formData = new FormData();
      formData.append('chain', 'polygon');
      formData.append('recipientAddress', recipientAddress);
      formData.append('name', metadata.name);
      formData.append('description', metadata.description);
      
      // Creature attributes
      const attributes = [
        { trait_type: 'Element', value: metadata.element },
        { trait_type: 'Level', value: metadata.level.toString() },
        { trait_type: 'Attack', value: metadata.stats.attack.toString() },
        { trait_type: 'Defense', value: metadata.stats.defense.toString() },
        { trait_type: 'Speed', value: metadata.stats.speed.toString() },
        { trait_type: 'Intelligence', value: metadata.stats.intelligence.toString() },
        { trait_type: 'Evolution Stage', value: metadata.evolutionStage || 'Base' },
        { trait_type: 'Battles', value: '0' },
        { trait_type: 'Wins', value: '0' },
        { trait_type: 'Behavior Type', value: 'Neutral' }
      ];
      
      formData.append('attributes', JSON.stringify(attributes));
      
      // Use a placeholder image for now (you can replace with actual creature images)
      formData.append('imageUrl', this.getCreatureImageUrl(metadata));
      
      const response = await axios.post(
        `${this.baseURL}/nft/mint/quickMintFromMetadata`,
        formData,
        {
          headers: {
            'X-API-Key': this.apiKey,
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error minting NFT:', error.response?.data || error.message);
      throw error;
    }
  }

  async updateNFTMetadata(tokenId, contractAddress, updatedMetadata) {
    try {
      const formData = new FormData();
      formData.append('chain', 'polygon');
      formData.append('contractAddress', contractAddress);
      formData.append('tokenId', tokenId);
      formData.append('name', updatedMetadata.name);
      formData.append('description', updatedMetadata.description || `${updatedMetadata.name} - Level ${updatedMetadata.level} ${updatedMetadata.element} creature`);
      
      // Updated attributes
      const attributes = [
        { trait_type: 'Element', value: updatedMetadata.element },
        { trait_type: 'Level', value: updatedMetadata.level.toString() },
        { trait_type: 'Attack', value: updatedMetadata.stats.attack.toString() },
        { trait_type: 'Defense', value: updatedMetadata.stats.defense.toString() },
        { trait_type: 'Speed', value: updatedMetadata.stats.speed.toString() },
        { trait_type: 'Intelligence', value: updatedMetadata.stats.intelligence.toString() },
        { trait_type: 'Evolution Stage', value: updatedMetadata.evolutionStage },
        { trait_type: 'Battles', value: updatedMetadata.battleCount.toString() },
        { trait_type: 'Wins', value: updatedMetadata.wins.toString() },
        { trait_type: 'Behavior Type', value: this.getDominantBehavior(updatedMetadata.behavior) }
      ];
      
      formData.append('attributes', JSON.stringify(attributes));
      formData.append('imageUrl', this.getCreatureImageUrl(updatedMetadata));
      
      const response = await axios.post(
        `${this.baseURL}/nft/update/updateTokenMetadata`,
        formData,
        {
          headers: {
            'X-API-Key': this.apiKey,
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating NFT metadata:', error.response?.data || error.message);
      throw error;
    }
  }

  async getNFTData(contractAddress, tokenId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/nft/data/nftDetails`,
        {
          params: {
            chain: 'polygon',
            contractAddress,
            tokenId
          },
          headers: this.headers
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching NFT data:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUserNFTs(walletAddress) {
    try {
      const response = await axios.get(
        `${this.baseURL}/nft/data/owned`,
        {
          params: {
            chain: 'polygon',
            walletAddress
          },
          headers: this.headers
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching user NFTs:', error.response?.data || error.message);
      throw error;
    }
  }

  getCreatureImageUrl(metadata) {
    // Generate image URL based on creature properties
    // In production, you'd have actual artwork hosted somewhere
    const baseImages = {
      fire: {
        base: 'https://api.dicebear.com/7.x/shapes/svg?seed=fire&backgroundColor=ff6b6b',
        evolved: 'https://api.dicebear.com/7.x/shapes/svg?seed=fire-evolved&backgroundColor=ff4444',
        ultimate: 'https://api.dicebear.com/7.x/shapes/svg?seed=fire-ultimate&backgroundColor=cc0000'
      },
      water: {
        base: 'https://api.dicebear.com/7.x/shapes/svg?seed=water&backgroundColor=4dabf7',
        evolved: 'https://api.dicebear.com/7.x/shapes/svg?seed=water-evolved&backgroundColor=339af0',
        ultimate: 'https://api.dicebear.com/7.x/shapes/svg?seed=water-ultimate&backgroundColor=1864ab'
      },
      earth: {
        base: 'https://api.dicebear.com/7.x/shapes/svg?seed=earth&backgroundColor=51cf66',
        evolved: 'https://api.dicebear.com/7.x/shapes/svg?seed=earth-evolved&backgroundColor=37b24d',
        ultimate: 'https://api.dicebear.com/7.x/shapes/svg?seed=earth-ultimate&backgroundColor=2b8a3e'
      }
    };

    const stage = metadata.evolutionStage || 'base';
    return baseImages[metadata.element]?.[stage] || baseImages.fire.base;
  }

  getDominantBehavior(behavior) {
    if (!behavior) return 'Neutral';
    
    const scores = {
      aggressive: behavior.aggressive || 0,
      defensive: behavior.defensive || 0,
      strategic: behavior.strategic || 0,
      adaptive: behavior.adaptive || 0
    };
    
    const max = Math.max(...Object.values(scores));
    if (max === 0) return 'Neutral';
    
    const dominant = Object.entries(scores).find(([_, value]) => value === max);
    return dominant ? dominant[0].charAt(0).toUpperCase() + dominant[0].slice(1) : 'Neutral';
  }
}

// Export singleton instance
const verbwireClient = new VerbwireClient();

export default verbwireClient;

// Named exports for specific functions
export const mintCreature = async (address, creatureData) => {
  return verbwireClient.mintNFT(address, creatureData);
};

export const updateCreatureMetadata = async (tokenId, metadata) => {
  // You'll need to store the contract address when minting
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS';
  return verbwireClient.updateNFTMetadata(tokenId, contractAddress, metadata);
};

export const getCreatureData = async (contractAddress, tokenId) => {
  return verbwireClient.getNFTData(contractAddress, tokenId);
};

export const getUserCreatures = async (walletAddress) => {
  return verbwireClient.getUserNFTs(walletAddress);
};