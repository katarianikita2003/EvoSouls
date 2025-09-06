import { ethers } from 'ethers';
import axios from 'axios';

const VERBWIRE_API_KEY = process.env.NEXT_PUBLIC_VERBWIRE_API_KEY;
const VERBWIRE_BASE_URL = 'https://api.verbwire.com/v1';

// Contract ABI (minimal required functions)
const CONTRACT_ABI = [
  "function mintCreature(string memory _name, uint8 _element, string memory _metadataURI) public payable",
  "function battle(uint256 _attackerId, uint256 _defenderId, uint256[] memory _moveSequence) public payable",
  "function evolveCreature(uint256 _tokenId, string memory _newMetadataURI) public payable",
  "function getCreatureData(uint256 _tokenId) public view returns (tuple(string name, uint8 element, uint8 stage, uint256 level, uint256 experience, uint256 battleCount, uint256 wins, tuple(uint256 attack, uint256 defense, uint256 speed, uint256 intelligence) stats, tuple(uint256 aggressive, uint256 defensive, uint256 strategic, uint256 risky, uint256 adaptive) behavior, bool isEvolvable, string metadataURI))",
  "event CreatureMinted(uint256 indexed tokenId, address indexed owner, uint8 element)",
  "event BattleCompleted(uint256 indexed winnerId, uint256 indexed loserId, uint256 behaviorChange)",
  "event CreatureEvolved(uint256 indexed tokenId, uint8 newStage)"
];

export class BlockchainService {
  constructor() {
    this.contract = null;
    this.signer = null;
    this.provider = null;
    this.contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  }

  async connect() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed');
    }

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    this.provider = new ethers.providers.Web3Provider(window.ethereum);
    this.signer = this.provider.getSigner();
    
    if (this.contractAddress) {
      this.contract = new ethers.Contract(
        this.contractAddress, 
        CONTRACT_ABI, 
        this.signer
      );
    }
    
    return await this.signer.getAddress();
  }

  async mintCreature(name, element, imageFile) {
    try {
      // Upload image to IPFS
      const imageUrl = await this.uploadImageToIPFS(imageFile);
      
      // Create metadata
      const metadata = {
        name: name,
        description: `A ${element} EvoSoul creature that evolves based on battle behavior`,
        image: imageUrl,
        attributes: [
          { trait_type: 'Element', value: element },
          { trait_type: 'Level', value: 1 },
          { trait_type: 'Evolution Stage', value: 'Base' },
          { trait_type: 'Battle Count', value: 0 },
          { trait_type: 'Behavior Type', value: 'Neutral' }
        ]
      };
      
      // Upload metadata to IPFS
      const metadataUrl = await this.uploadMetadataToIPFS(metadata);
      
      // Mint on blockchain (if contract is deployed)
      let tokenId, transactionHash;
      
      if (this.contract) {
        const elementEnum = ['fire', 'water', 'earth'].indexOf(element.toLowerCase());
        const mintPrice = ethers.utils.parseEther('0.5');
        
        const tx = await this.contract.mintCreature(
          name,
          elementEnum,
          metadataUrl,
          { value: mintPrice }
        );
        
        const receipt = await tx.wait();
        const mintEvent = receipt.events.find(e => e.event === 'CreatureMinted');
        tokenId = mintEvent.args.tokenId.toString();
        transactionHash = tx.hash;
      } else {
        // Demo mode - generate mock data
        tokenId = `demo-${Date.now()}`;
        transactionHash = `0xdemo${Date.now()}`;
      }
      
      // Save to backend
      await this.saveCreatureToBackend(tokenId, {
        name,
        element: element.toLowerCase(),
        owner: await this.signer.getAddress(),
        metadataURI: metadataUrl,
        imageURL: imageUrl,
        transactionHash,
        contractAddress: this.contractAddress || 'demo'
      });
      
      return {
        success: true,
        tokenId,
        transactionHash,
        metadataUrl,
        imageUrl
      };
    } catch (error) {
      console.error('Minting failed:', error);
      throw error;
    }
  }

  async uploadImageToIPFS(imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const response = await axios.post(
        `${VERBWIRE_BASE_URL}/nft/store/file`,
        formData,
        {
          headers: {
            'X-API-Key': VERBWIRE_API_KEY,
            'Accept': 'application/json'
          }
        }
      );

      return response.data.ipfs_url;
    } catch (error) {
      console.error('IPFS upload failed:', error);
      // Fallback to a placeholder image
      return `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`;
    }
  }

  async uploadMetadataToIPFS(metadata) {
    try {
      const response = await axios.post(
        `${VERBWIRE_BASE_URL}/nft/store/metadata`,
        metadata,
        {
          headers: {
            'X-API-Key': VERBWIRE_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return response.data.ipfs_url;
    } catch (error) {
      console.error('Metadata upload failed:', error);
      // Return a data URL as fallback
      return `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
    }
  }

  async saveCreatureToBackend(tokenId, data) {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/creatures`,
      {
        tokenId,
        ...data
      }
    );
    
    return response.data;
  }

  async battle(attackerId, defenderId, moveSequence) {
    if (this.contract) {
      const battleFee = ethers.utils.parseEther('0.1');
      
      const tx = await this.contract.battle(
        attackerId,
        defenderId,
        moveSequence,
        { value: battleFee }
      );
      
      const receipt = await tx.wait();
      return receipt;
    }
    
    // Demo mode
    return { transactionHash: `0xdemo${Date.now()}` };
  }

  async evolveCreature(tokenId, evolutionData) {
    try {
      // Generate evolved image
      const evolvedImage = await this.generateEvolvedImage(tokenId, evolutionData);
      const imageUrl = await this.uploadImageToIPFS(evolvedImage);
      
      // Create evolved metadata
      const metadata = {
        name: `${evolutionData.stage} ${evolutionData.originalName}`,
        description: `An evolved ${evolutionData.element} EvoSoul. Dominant behavior: ${evolutionData.dominantBehavior}`,
        image: imageUrl,
        attributes: [
          { trait_type: 'Element', value: evolutionData.element },
          { trait_type: 'Level', value: evolutionData.level },
          { trait_type: 'Evolution Stage', value: evolutionData.stage },
          { trait_type: 'Battle Count', value: evolutionData.battleCount },
          { trait_type: 'Behavior Type', value: evolutionData.dominantBehavior },
          { trait_type: 'Attack', value: evolutionData.stats.attack },
          { trait_type: 'Defense', value: evolutionData.stats.defense },
          { trait_type: 'Speed', value: evolutionData.stats.speed },
          { trait_type: 'Intelligence', value: evolutionData.stats.intelligence }
        ]
      };
      
      // Upload new metadata
      const metadataUrl = await this.uploadMetadataToIPFS(metadata);
      
      // Execute evolution on blockchain
      let transactionHash;
      if (this.contract) {
        const evolutionFee = ethers.utils.parseEther('0.5');
        const tx = await this.contract.evolveCreature(tokenId, metadataUrl, {
          value: evolutionFee
        });
        
        await tx.wait();
        transactionHash = tx.hash;
      } else {
        transactionHash = `0xdemo-evolution-${Date.now()}`;
      }
      
      // Update backend
      await this.updateCreatureMetadata(tokenId, metadataUrl, imageUrl);
      
      return {
        success: true,
        newMetadataUrl: metadataUrl,
        newImageUrl: imageUrl,
        transactionHash
      };
    } catch (error) {
      console.error('Evolution failed:', error);
      throw error;
    }
  }

  async generateEvolvedImage(tokenId, evolutionData) {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    
    // Background gradient based on behavior
    const gradients = {
      aggressive: ['#ff0000', '#ff6600'],
      defensive: ['#0066ff', '#00ccff'],
      strategic: ['#9900ff', '#ff00ff'],
      risky: ['#ffcc00', '#ff6600'],
      adaptive: ['#00ff00', '#00ffff']
    };
    
    const colors = gradients[evolutionData.dominantBehavior] || gradients.adaptive;
    const gradient = ctx.createLinearGradient(0, 0, 500, 500);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 500, 500);
    
    // Add evolution effects
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(250, 250, 150, 0, Math.PI * 2);
    ctx.fill();
    
    // Add text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(evolutionData.stage.toUpperCase(), 250, 200);
    
    ctx.font = '32px Arial';
    ctx.fillText(evolutionData.element.toUpperCase(), 250, 250);
    
    ctx.font = '24px Arial';
    ctx.fillText(`Level ${evolutionData.level}`, 250, 300);
    
    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
  }

  async updateCreatureMetadata(tokenId, metadataUrl, imageUrl) {
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/creatures/${tokenId}/metadata`,
      {
        metadataURI: metadataUrl,
        imageURL: imageUrl
      }
    );
    
    return response.data;
  }

  async getUserCreatures(address) {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/creatures/user/${address}`
    );
    
    return response.data;
  }
}