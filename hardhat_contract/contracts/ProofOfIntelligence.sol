// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";


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

    address contractAddress = 0x4305FB66699C3B2702D4d05CF36551390A4c69C6;
    IPyth pyth = IPyth(contractAddress);

    struct Agent {
        string agentAddress;
        string agentWalletAddress;
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

    mapping(string => Agent) public agents;
    mapping(uint256 => Mempool) public mempoolTxs;
    string[] public top10Agents;

    error POI__NotRegisteredAgent();
    error POI__InvalidPrediction();
    error POI__MempoolTxNotExist();
    error POI__PythUpdateFailed();
    error POI__NoNewPriceData();

    event NewGuess(address indexed agent, bool correct, uint256 blockNumber);
    event AgentRegistered(string indexed agent, string walletAddress);
    event LeaderboardUpdated(string[] topAgents);
    event NewMempoolTx(address indexed txHash, uint256 gasPrice, uint256 blockNumber);
    event PriceUpdated(int256 newPrice, uint256 timestamp);
    event BlockMined(uint256 blockNumber, address miner);
    event PriceFeedUpdatedOnChainPyth(int256 price);

    modifier onlyRegisteredAgent(string memory agentAddress) {
        require(bytes(agents[agentAddress].agentAddress).length != 0, "Not a registered agent");
        _;
    }

    function registerAgent(Agent memory agent) external {
        require(bytes(agents[agent.agentAddress].agentAddress).length == 0, "Agent already registered");
        agents[agent.agentAddress] = agent;
        emit AgentRegistered(agent.agentAddress, agent.agentWalletAddress);
    }

    function getAgent(string memory agentAddress) external view returns (Agent memory) {
        return agents[agentAddress];
    }

    function recordMempool(TxData memory txData) external {
        mempoolTxs[current_mempool] = Mempool(txData, txData.gasPrice, txData.blockNumber, false);
        emit NewMempoolTx(txData.txHash, txData.gasPrice, txData.blockNumber);
    }

    function isCurrentMempoolValidated() external view returns (bool) {
        return mempoolTxs[current_mempool].isValidated;
    }

    

    function checkPrediction(string memory agentAddress, int256 prediction, bytes32 priceFeed) external onlyRegisteredAgent(agentAddress) {
    }

    function updateLeaderboard(Agent memory newAgentDetails) internal {
        int256 position = 1;
        uint256 len = top10Agents.length;
        for (uint256 i = 0; i < len; i++) {
            if (newAgentDetails.accuracy > agents[top10Agents[i]].accuracy) {
                position = int256(i) + 1;
                break;
            }
        }
        if (position > 10) {
            return; // Not in top 10
        }
        if (len < 10) {
            top10Agents.push(newAgentDetails.agentAddress);
        } else {
            top10Agents[uint256(position) - 1] = newAgentDetails.agentAddress;
        }
        // Shift agents down the leaderboard
        for (uint256 i = uint256(position); i < len; i++) {
            if (i + 1 < len) {
                top10Agents[i] = top10Agents[i + 1];
            }
        }
        emit LeaderboardUpdated(top10Agents);
    }

    function updatePythPrice(bytes memory priceData, int256 price) internal {
        bytes[] memory updateData = new bytes[](1);
        updateData[0] = priceData;
        uint feeAmount = pyth.getUpdateFee(updateData);
        try pyth.updatePriceFeeds{value: feeAmount}(updateData) {
            emit PriceFeedUpdatedOnChainPyth(price);
        } catch {
            revert POI__PythUpdateFailed();
        }
    }

    function readPythPrice(bytes32 priceFeed) internal view returns (int256, uint256) {
        PythStructs.Price memory currentBasePrice = pyth.getPriceNoOlderThan(priceFeed, 0);
        return (currentBasePrice.price, currentBasePrice.publishTime);
    }

    function validateMempool(uint256 mempoolId, bool isValid, string memory agentAddress) internal onlyRegisteredAgent(agentAddress) {
        require(mempoolTxs[mempoolId].txData.txHash != address(0), "Mempool tx does not exist");
        mempoolTxs[mempoolId].isValidated = isValid;
        current_mempool++;
    }

}