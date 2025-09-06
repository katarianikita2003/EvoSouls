// frontend/utils/verbwireIntegration.js
import axios from 'axios';

class VerbwireIntegration {
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_VERBWIRE_API_KEY;
    this.baseURL = 'https://api.verbwire.com/v1';
    this.contractAddress = null; // Will be set after first deployment
    this.chain = 'polygon'; // Using Polygon for low fees
  }

  // Initialize headers for all requests
  getHeaders() {
    return {
      'X-API-Key': this.apiKey,
      'Accept': 'application/json'
    };
  }

  // 1. Deploy NFT Contract (one-time setup)
  async deployContract() {
    try {
      const response = await axios.post(
        `${this.baseURL}/nft/deploy/collection`,
        {
          chain: this.chain,
          contractName: 'EvoSouls',
          contractSymbol: 'EVO',
          contractType: 'ERC721'
        },
        { headers: this.getHeaders() }
      );

      this.contractAddress = response.data.contract_address;
      console.log('Contract deployed:', this.contractAddress);
      return response.data;
    } catch (error) {
      console.error('Contract deployment failed:', error);
      throw error;
    }
  }

  // 2. Upload Image to IPFS
  async uploadImageToIPFS(imageDataOrUrl) {
    try {
      const formData = new FormData();
      
      // If it's a URL, fetch the image first
      if (typeof imageDataOrUrl === 'string' && imageDataOrUrl.startsWith('http')) {
        const response = await fetch(imageDataOrUrl);
        const blob = await response.blob();
        formData.append('image', blob, 'creature.png');
      } else if (imageDataOrUrl instanceof Blob || imageDataOrUrl instanceof File) {
        formData.append('image', imageDataOrUrl);
      } else {
        // Base64 data
        const base64Data = imageDataOrUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        formData.append('image', blob, 'creature.png');
      }

      const response = await axios.post(
        `${this.baseURL}/nft/store/image`,
        formData,
        {
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data.ipfs_url;
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  // 3. Upload Metadata to IPFS
  async uploadMetadataToIPFS(metadata) {
    try {
      const response = await axios.post(
        `${this.baseURL}/nft/store/metadata`,
        metadata,
        { headers: this.getHeaders() }
      );

      return response.data.ipfs_url;
    } catch (error) {
      console.error('Metadata upload failed:', error);
      throw error;
    }
  }

  // 4. Mint NFT with full creature data
  async mintCreature(recipientAddress, creatureData) {
    try {
      // Generate creature image (for demo, using placeholder service)
      const imageUrl = this.generateCreatureImage(creatureData);
      
      // Upload image to IPFS
      const imageIPFS = await this.uploadImageToIPFS(imageUrl);

      // Create metadata
      const metadata = {
        name: creatureData.name,
        description: `A ${creatureData.element} EvoSoul creature that evolves based on how you play.`,
        image: imageIPFS,
        attributes: [
          { trait_type: 'Element', value: creatureData.element },
          { trait_type: 'Level', value: 1 },
          { trait_type: 'Evolution Stage', value: 'Base' },
          { trait_type: 'Attack', value: creatureData.stats.attack },
          { trait_type: 'Defense', value: creatureData.stats.defense },
          { trait_type: 'Speed', value: creatureData.stats.speed },
          { trait_type: 'Intelligence', value: creatureData.stats.intelligence },
          { trait_type: 'Battles', value: 0 },
          { trait_type: 'Wins', value: 0 },
          { trait_type: 'Dominant Behavior', value: 'Neutral' },
          { trait_type: 'Created', value: new Date().toISOString() }
        ],
        properties: {
          element: creatureData.element,
          evolution_stage: 'Base',
          behavior_scores: {
            aggressive: 0,
            defensive: 0,
            strategic: 0,
            risky: 0,
            adaptive: 0
          }
        }
      };

      // Upload metadata to IPFS
      const metadataIPFS = await this.uploadMetadataToIPFS(metadata);

      // Mint the NFT
      const formData = new FormData();
      formData.append('chain', this.chain);
      formData.append('contractAddress', this.contractAddress || 'YOUR_CONTRACT_ADDRESS');
      formData.append('recipientAddress', recipientAddress);
      formData.append('tokenId', Date.now().toString()); // Unique token ID
      formData.append('metadataUri', metadataIPFS);
      formData.append('quantity', '1');

      const response = await axios.post(
        `${this.baseURL}/nft/mint/mintNFT`,
        formData,
        {
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return {
        success: true,
        tokenId: response.data.token_id,
        transactionHash: response.data.transaction_hash,
        metadata: metadata,
        ipfs: {
          image: imageIPFS,
          metadata: metadataIPFS
        }
      };
    } catch (error) {
      console.error('Minting failed:', error);
      // For demo mode, return mock success
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return {
          success: true,
          tokenId: `demo-${Date.now()}`,
          transactionHash: `0xdemo${Date.now()}`,
          metadata: metadata,
          demo: true
        };
      }
      throw error;
    }
  }

  // 5. Update NFT Metadata after evolution
  async updateCreatureAfterEvolution(tokenId, evolutionData) {
    try {
      // Generate new evolved image
      const evolvedImageUrl = this.generateEvolvedCreatureImage(evolutionData);
      const imageIPFS = await this.uploadImageToIPFS(evolvedImageUrl);

      // Create updated metadata
      const updatedMetadata = {
        name: evolutionData.metadata.name,
        description: evolutionData.metadata.description,
        image: imageIPFS,
        attributes: evolutionData.metadata.attributes,
        properties: evolutionData.metadata.properties,
        evolution_history: {
          evolved_at: new Date().toISOString(),
          from_stage: evolutionData.previousStage,
          to_stage: evolutionData.nextStage,
          dominant_behavior: evolutionData.behaviorType.primary,
          battle_count: evolutionData.battleCount
        }
      };

      // Upload new metadata
      const metadataIPFS = await this.uploadMetadataToIPFS(updatedMetadata);

      // Update the NFT
      const response = await axios.patch(
        `${this.baseURL}/nft/update/updateNFT`,
        {
          chain: this.chain,
          contractAddress: this.contractAddress,
          tokenId: tokenId,
          metadataUri: metadataIPFS
        },
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        transactionHash: response.data.transaction_hash,
        newMetadata: updatedMetadata,
        ipfs: {
          image: imageIPFS,
          metadata: metadataIPFS
        }
      };
    } catch (error) {
      console.error('Evolution update failed:', error);
      // Demo mode fallback
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        return {
          success: true,
          transactionHash: `0xevolution${Date.now()}`,
          demo: true
        };
      }
      throw error;
    }
  }

  // 6. Get NFT Data
  async getCreatureData(tokenId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/nft/data/getNFTData`,
        {
          params: {
            chain: this.chain,
            contractAddress: this.contractAddress,
            tokenId: tokenId
          },
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to fetch NFT data:', error);
      throw error;
    }
  }

  // 7. Get all NFTs owned by a wallet
  async getUserCreatures(walletAddress) {
    try {
      const response = await axios.get(
        `${this.baseURL}/nft/data/owned`,
        {
          params: {
            chain: this.chain,
            walletAddress: walletAddress
          },
          headers: this.getHeaders()
        }
      );

      return response.data.nfts || [];
    } catch (error) {
      console.error('Failed to fetch user NFTs:', error);
      return [];
    }
  }

  // 8. Store battle data on IPFS (for permanent record)
  async storeBattleData(battleData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/nft/store/metadata`,
        {
          type: 'battle_record',
          timestamp: new Date().toISOString(),
          ...battleData
        },
        { headers: this.getHeaders() }
      );

      return response.data.ipfs_url;
    } catch (error) {
      console.error('Failed to store battle data:', error);
      throw error;
    }
  }

  // 9. Cross-chain NFT data (if needed)
  async getCrossChainData(contractAddress, tokenId, targetChain) {
    try {
      const response = await axios.get(
        `${this.baseURL}/nft/data/crossChain`,
        {
          params: {
            sourceChain: this.chain,
            targetChain: targetChain,
            contractAddress: contractAddress,
            tokenId: tokenId
          },
          headers: this.getHeaders()
        }
      );

      return response.data;
    } catch (error) {
      console.error('Cross-chain query failed:', error);
      throw error;
    }
  }

  // Helper: Generate creature image URL
  generateCreatureImage(creatureData) {
    // In production, use AI image generation or custom artwork
    // For hackathon, using a dynamic avatar service
    const colors = {
      fire: 'FF6B6B,FF8E53',
      water: '4DABF7,339AF0',
      earth: '51CF66,37B24D'
    };

    const params = new URLSearchParams({
      seed: creatureData.name,
      backgroundColor: colors[creatureData.element]?.split(',')[0] || 'FF6B6B',
      backgroundType: 'gradientLinear',
      backgroundRotation: '135'
    });

    return `https://api.dicebear.com/7.x/bottts-neutral/svg?${params}`;
  }

  // Helper: Generate evolved creature image
  generateEvolvedCreatureImage(evolutionData) {
    const colors = {
      aggressive: 'DC143C,FF0000',
      defensive: '4169E1,00BFFF',
      strategic: '9400D3,FF00FF',
      risky: 'FFD700,FF8C00',
      adaptive: '00FF00,00CED1'
    };

    const params = new URLSearchParams({
      seed: evolutionData.metadata.name,
      backgroundColor: colors[evolutionData.behaviorType.primary]?.split(',')[0] || 'FF6B6B',
      backgroundType: 'gradientLinear',
      backgroundRotation: '45',
      scale: evolutionData.evolutionData.visualTraits.size || 120
    });

    return `https://api.dicebear.com/7.x/bottts-neutral/svg?${params}`;
  }
}

// Export singleton instance
const verbwireIntegration = new VerbwireIntegration();

// Named exports for easy use
export const mintCreature = (address, data) => verbwireIntegration.mintCreature(address, data);
export const updateCreatureEvolution = (tokenId, data) => verbwireIntegration.updateCreatureAfterEvolution(tokenId, data);
export const getCreatureData = (tokenId) => verbwireIntegration.getCreatureData(tokenId);
export const getUserCreatures = (address) => verbwireIntegration.getUserCreatures(address);
export const storeBattleData = (data) => verbwireIntegration.storeBattleData(data);

export default verbwireIntegration;