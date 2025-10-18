// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title POIToken
 * @dev Proof of Intelligence reward token
 * Standard ERC20 with minting controlled by ProofOfIntelligence contract
 */
contract POIToken is ERC20, Ownable {
    
    address public proofOfIntelligenceContract;
    
    event ProofOfIntelligenceContractSet(address indexed contractAddress);
    event TokensMinted(address indexed to, uint256 amount);
    
    constructor() ERC20("Proof of Intelligence Token", "POI") Ownable(msg.sender) {
        // Initial supply: 1 million POI tokens to deployer for initial distribution
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }
    
    /**
     * @dev Set the ProofOfIntelligence contract address (only owner)
     * @param _contractAddress Address of the ProofOfIntelligence contract
     */
    function setProofOfIntelligenceContract(address _contractAddress) external onlyOwner {
        require(_contractAddress != address(0), "Invalid contract address");
        proofOfIntelligenceContract = _contractAddress;
        emit ProofOfIntelligenceContractSet(_contractAddress);
    }
    
    /**
     * @dev Mint tokens (only ProofOfIntelligence contract can call)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == proofOfIntelligenceContract, "Only POI contract can mint");
        require(to != address(0), "Cannot mint to zero address");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
