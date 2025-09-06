// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EvoSouls is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Creature data structure
    struct Creature {
        string name;
        string element;
        uint256 level;
        uint256 battleCount;
        uint256 wins;
        string evolutionStage;
        uint256 mintedAt;
        uint256 lastBattleTime;
    }

    // Mappings
    mapping(uint256 => Creature) public creatures;
    mapping(address => uint256[]) public ownerCreatures;
    mapping(uint256 => bool) public isEvolved;
    
    // Events
    event CreatureMinted(uint256 indexed tokenId, address indexed owner, string element);
    event CreatureEvolved(uint256 indexed tokenId, string newStage);
    event BattleCompleted(uint256 indexed creatureId, bool won);
    
    // Base URI for metadata
    string public baseTokenURI;
    
    // Mint price
    uint256 public constant MINT_PRICE = 0.5 ether; // 0.5 MATIC
    
    constructor(string memory _name, string memory _symbol, string memory _baseURI) 
        ERC721(_name, _symbol) 
        Ownable(msg.sender) 
    {
        baseTokenURI = _baseURI;
    }
    
    function mintCreature(
        string memory _name,
        string memory _element
    ) public payable {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(
            keccak256(bytes(_element)) == keccak256(bytes("fire")) ||
            keccak256(bytes(_element)) == keccak256(bytes("water")) ||
            keccak256(bytes(_element)) == keccak256(bytes("earth")),
            "Invalid element"
        );
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(msg.sender, tokenId);
        
        creatures[tokenId] = Creature({
            name: _name,
            element: _element,
            level: 1,
            battleCount: 0,
            wins: 0,
            evolutionStage: "Base",
            mintedAt: block.timestamp,
            lastBattleTime: 0
        });
        
        ownerCreatures[msg.sender].push(tokenId);
        
        emit CreatureMinted(tokenId, msg.sender, _element);
    }
    
    function updateBattleStats(uint256 _tokenId, bool _won) public {
        require(_exists(_tokenId), "Creature does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");
        
        Creature storage creature = creatures[_tokenId];
        creature.battleCount++;
        if (_won) {
            creature.wins++;
        }
        creature.lastBattleTime = block.timestamp;
        
        // Level up every 5 wins
        if (creature.wins > 0 && creature.wins % 5 == 0) {
            creature.level++;
        }
        
        emit BattleCompleted(_tokenId, _won);
    }
    
    function evolveCreature(uint256 _tokenId, string memory _newStage) public {
        require(_exists(_tokenId), "Creature does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not the owner");
        require(!isEvolved[_tokenId], "Already evolved");
        
        Creature storage creature = creatures[_tokenId];
        require(creature.battleCount >= 10, "Not enough battles");
        
        creature.evolutionStage = _newStage;
        isEvolved[_tokenId] = true;
        
        emit CreatureEvolved(_tokenId, _newStage);
    }
    
    function setTokenURI(uint256 _tokenId, string memory _tokenURI) public {
        require(ownerOf(_tokenId) == msg.sender || owner() == msg.sender, "Not authorized");
        _setTokenURI(_tokenId, _tokenURI);
    }
    
    function getCreature(uint256 _tokenId) public view returns (Creature memory) {
        require(_exists(_tokenId), "Creature does not exist");
        return creatures[_tokenId];
    }
    
    function getUserCreatures(address _owner) public view returns (uint256[] memory) {
        return ownerCreatures[_owner];
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
    
    // Override functions
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}