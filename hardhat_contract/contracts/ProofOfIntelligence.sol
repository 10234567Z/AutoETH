// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract ProofOfIntelligence {
    // TODO: Implement following logic 
    // pyth price feeder function
    // Tx validator for mempool
    // agent prediction checker
    // updating onchain stats 
    // 	leaderboard
    // 	agent-specific
    // 	loggin
    // 	events for frontend
    // getter functions
    // 	agent-specific
    // 	leaderboard
    // 	recentmost log
    // 	recentmost guess
    // 	recentmost block mined
    //  mempool txs

    struct Agent {
        address agentAddress;
        address agentWalletAddress;
        uint256 totalGuesses;
        uint256 correctGuesses;
        uint256 accuracy; // percentage of correct guesses
        uint256 lastGuessBlock;
    }

    mapping(address => Agent) public agents;
    address[] public top10Agents;

    event NewGuess(address indexed agent, bool correct, uint256 blockNumber);
    event AgentRegistered(address indexed agent, address walletAddress);
    event LeaderboardUpdated(address[] topAgents);
    event NewMempoolTx(address indexed txHash, uint256 gasPrice, uint256 blockNumber);
    event PriceUpdated(int256 newPrice, uint256 timestamp);
    event BlockMined(uint256 blockNumber, address miner);

    modifier onlyRegisteredAgent() {
        require(agents[msg.sender].agentAddress != address(0), "Not a registered agent");
        _;
    }

    function registerAgent(Agent memory agent) external {
        require(agents[agent.agentAddress].agentAddress == address(0), "Agent already registered");
        agents[agent.agentAddress] = agent;
        emit AgentRegistered(agent.agentAddress, agent.agentWalletAddress);
    }
}