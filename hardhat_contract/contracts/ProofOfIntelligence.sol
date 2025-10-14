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
        uint256 bestGuesses;
        uint256 accuracy; // percentage of correct guesses
        uint256 lastGuessBlock;
    }

    struct Mempool {
        TxData txData;
        uint256 gasPrice;
        uint256 blockNumber;
        bool isValidated;
    }

    struct TxData {
        address txHash;
        uint256 gasPrice;
        uint256 blockNumber;
    }
    uint256 public current_mempool = 1;
    uint256 public blockMined = 0;

    mapping(address => Agent) public agents;
    mapping(uint256 => Mempool) public mempoolTxs;
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

    function getAgent(address agentAddress) external view returns (Agent memory) {
        return agents[agentAddress];
    }

    function recordMempool(TxData memory txData) external {
        mempoolTxs[current_mempool] = Mempool(txData, txData.gasPrice, txData.blockNumber, false);
        emit NewMempoolTx(txData.txHash, txData.gasPrice, txData.blockNumber);
    }

    function isCurrentMempoolValidated() external view returns (bool) {
        return mempoolTxs[current_mempool].isValidated;
    }

    function checkPrediction(address agentAddress, bool prediction) external onlyRegisteredAgent {

    }

    function updateLeaderboard() internal {
        // Logic to update top10Agents based on accuracy
        emit LeaderboardUpdated(top10Agents);
    }

    function getPythPrice() external view returns (int256, uint256) {
        // Placeholder for Pyth price fetching logic
        return (0, block.timestamp);
    }

    function validateMempool(uint256 mempoolId, bool isValid) internal onlyRegisteredAgent {
        require(mempoolTxs[mempoolId].txData.txHash != address(0), "Mempool tx does not exist");
        mempoolTxs[mempoolId].isValidated = isValid;
        current_mempool++;
    }

}