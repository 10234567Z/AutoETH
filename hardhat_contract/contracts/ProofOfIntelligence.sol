// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

contract ProofOfIntelligence {

    address contractAddress = 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21;
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

    struct Prediction {
        string agentAddress;
        int256 predictedPrice;
        uint256 timestamp;
        bool submitted;
    }

    struct Block {
        uint256 blockNumber;
        uint256 timestamp;
        string minerAgent;
        bytes32 blockHash;
        bytes32 previousBlockHash;
        int256 targetPrice;
    }

    struct PredictionRound {
        uint256 forBlockNumber;
        uint256 startTime;
        uint256 submissionDeadline;
        uint256 predictionCount;
        bool finalized;
        string winnerAgent;
        int256 actualPrice;
        string[] participants; // Track who submitted predictions
    }

    struct PredictionHistory {
        uint256 roundId;
        int256 predicted;
        int256 actual;
        int256 difference;
        uint256 timestamp;
    }

    uint256 public constant ROUND_DURATION = 30;
    uint256 public constant SUBMISSION_WINDOW = 30;

    uint256 public currentBlockNumber;
    uint256 public currentPredictionRound;

    mapping(uint256 => Block) public blockchain;
    mapping(uint256 => PredictionRound) public predictionRounds;
    mapping(uint256 => mapping(string => Prediction)) public roundPredictions;
    
    // Self-learning mappings
    mapping(string => PredictionHistory[]) public agentHistory;
    mapping(string => int256) public agentBias; // Average over/under prediction

    uint256 public current_mempool = 1;

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
    event NewMempoolTx(
        address indexed txHash,
        uint256 gasPrice,
        uint256 blockNumber
    );
    event PriceUpdated(int256 newPrice, uint256 timestamp);
    event BlockMined(
        uint256 indexed blockNumber,
        string indexed minerAgent,
        bytes32 blockHash
    );
    event PriceFeedUpdatedOnChainPyth(int256 price);
    event PredictionRoundStarted(
        uint256 indexed roundId,
        uint256 forBlockNumber
    );
    event PredictionSubmitted(
        string indexed agentAddress,
        int256 price,
        uint256 roundId
    );
    event RoundFinalized(
        uint256 indexed roundId,
        string winner,
        int256 actualPrice
    );
    event HistoryRecorded(
        string indexed agentAddress,
        uint256 roundId,
        int256 predicted,
        int256 actual,
        int256 difference
    );

    constructor() {
        // Mine genesis block
        _mineGenesisBlock();
    }

    modifier onlyRegisteredAgent(string memory agentAddress) {
        require(
            bytes(agents[agentAddress].agentAddress).length != 0,
            "Not a registered agent"
        );
        _;
    }

    function registerAgent(Agent memory agent) external {
        require(
            bytes(agents[agent.agentAddress].agentAddress).length == 0,
            "Agent already registered"
        );
        agents[agent.agentAddress] = agent;
        emit AgentRegistered(agent.agentAddress, agent.agentWalletAddress);
    }

    function getAgent(
        string memory agentAddress
    ) external view returns (Agent memory) {
        return agents[agentAddress];
    }

    function recordMempool(TxData memory txData) external {
        mempoolTxs[current_mempool] = Mempool(
            txData,
            txData.gasPrice,
            txData.blockNumber,
            false
        );
        emit NewMempoolTx(txData.txHash, txData.gasPrice, txData.blockNumber);
    }

    function isCurrentMempoolValidated() external view returns (bool) {
        return mempoolTxs[current_mempool].isValidated;
    }

    function submitPrediction(
        string memory agentAddress,
        int256 predictedPrice
    ) external onlyRegisteredAgent(agentAddress) {
        require(currentPredictionRound > 0, "No active round");
        
        PredictionRound storage round = predictionRounds[
            currentPredictionRound
        ];

        require(!round.finalized, "Round already finalized");

        // Check if within submission window
        require(
            block.timestamp <= round.submissionDeadline,
            "Submission window closed"
        );
        require(
            !roundPredictions[currentPredictionRound][agentAddress].submitted,
            "Already submitted"
        );

        // Record prediction
        roundPredictions[currentPredictionRound][agentAddress] = Prediction({
            agentAddress: agentAddress,
            predictedPrice: predictedPrice,
            timestamp: block.timestamp,
            submitted: true
        });

        round.predictionCount++;
        round.participants.push(agentAddress);
        agents[agentAddress].totalGuesses++;
        agents[agentAddress].lastGuessBlock = block.number;

        emit PredictionSubmitted(
            agentAddress,
            predictedPrice,
            currentPredictionRound
        );
    }

    // Manually start a new prediction round (called by judging agent)
    function startNewRound() external {
        require(current_mempool >= 1, "Need at least 1 mempool transaction");
        require(
            currentPredictionRound == 0 || predictionRounds[currentPredictionRound].finalized,
            "Round still active"
        );
        _startNewRound();
    }

    // Judge predictions and mine the block
    function finalizeRoundAndMineBlock(
        bytes[] memory pythPriceUpdate,
        bytes32 priceFeedId
    ) external payable {
        PredictionRound storage round = predictionRounds[
            currentPredictionRound
        ];

        require(!round.finalized, "Already finalized");
        require(
            block.timestamp > round.submissionDeadline,
            "Still accepting predictions"
        );

        // Handle empty round
        if (round.predictionCount == 0) {
            round.finalized = true;
            emit RoundFinalized(currentPredictionRound, "", 0);
            return;
        }

        // Try to update price from Pyth
        int256 actualPrice = updatePythPrice(pythPriceUpdate[0], priceFeedId);
        
        // If Pyth failed (-1), use a default price for testing (2500 USD * 100 = 250000 for 2 decimals)
        if (actualPrice == -1) {
            actualPrice = 250000;
            emit PriceFeedUpdatedOnChainPyth(actualPrice);
        }

        round.actualPrice = actualPrice;
        round.finalized = true;

        // Determine winner (agent with closest prediction)
        string memory winner = _determineWinner(
            currentPredictionRound,
            actualPrice
        );
        round.winnerAgent = winner;

        // Record prediction history for all participants
        for (uint256 i = 0; i < round.participants.length; i++) {
            string memory agentAddr = round.participants[i];
            Prediction storage pred = roundPredictions[currentPredictionRound][agentAddr];
            
            if (pred.submitted) {
                // Record history
                _recordPredictionHistory(
                    agentAddr,
                    currentPredictionRound,
                    int64(pred.predictedPrice),
                    int64(actualPrice)
                );
                
                // Update agent stats
                agents[agentAddr].totalGuesses++;
                _updateAgentBias(agentAddr);
                _updateAgentAccuracy(agentAddr);
            }
        }

        // Mine the block
        _mineBlock(winner, actualPrice);

        emit RoundFinalized(
            currentPredictionRound,
            round.winnerAgent,
            actualPrice
        );
    }

    // Start new prediction round
    function _startNewRound() internal {
        currentPredictionRound++;

        PredictionRound storage newRound = predictionRounds[currentPredictionRound];
        newRound.forBlockNumber = currentBlockNumber + 1;
        newRound.startTime = block.timestamp;
        newRound.submissionDeadline = block.timestamp + SUBMISSION_WINDOW;
        newRound.predictionCount = 0;
        newRound.finalized = false;
        newRound.winnerAgent = "";
        newRound.actualPrice = 0;
        // participants array is automatically initialized as empty

        emit PredictionRoundStarted(
            currentPredictionRound,
            currentBlockNumber + 1
        );
    }

    // Mine genesis block
    function _mineGenesisBlock() internal {
        currentBlockNumber = 1;

        blockchain[1] = Block({
            blockNumber: 1,
            timestamp: block.timestamp,
            minerAgent: "GENESIS",
            blockHash: keccak256(abi.encodePacked("GENESIS")),
            previousBlockHash: bytes32(0),
            targetPrice: 0
        });

        emit BlockMined(1, "GENESIS", blockchain[1].blockHash);
    }

    // Mine a new block with winner
    function _mineBlock(string memory minerAgent, int256 targetPrice) internal {
        currentBlockNumber++;

        bytes32 prevHash = blockchain[currentBlockNumber - 1].blockHash;

        bytes32 newBlockHash = keccak256(
            abi.encodePacked(
                currentBlockNumber,
                block.timestamp,
                minerAgent,
                targetPrice,
                prevHash
            )
        );

        blockchain[currentBlockNumber] = Block({
            blockNumber: currentBlockNumber,
            timestamp: block.timestamp,
            minerAgent: minerAgent,
            blockHash: newBlockHash,
            previousBlockHash: prevHash,
            targetPrice: targetPrice
        });

        // Reward the miner
        agents[minerAgent].bestGuesses++;

        emit BlockMined(currentBlockNumber, minerAgent, newBlockHash);
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

    function readPythPrice(
        bytes32 priceFeed
    ) public view returns (int256, uint256) {
        PythStructs.Price memory currentBasePrice = pyth.getPriceNoOlderThan(
            priceFeed,
            0
        );
        return (currentBasePrice.price, currentBasePrice.publishTime);
    }

    function updatePythPrice(
        bytes memory priceData,
        bytes32 priceFeed
    ) public payable returns (int256) {
        bytes[] memory updateData = new bytes[](1);
        updateData[0] = priceData;
        
        try pyth.updatePriceFeeds{value: msg.value}(updateData) {
            // If update succeeds, read the price
            (int256 price, ) = readPythPrice(priceFeed);
            emit PriceFeedUpdatedOnChainPyth(price);
            return price;
        } catch {
            // If Pyth update fails, use a reasonable fallback price
            // Return -1 to indicate Pyth failed (caller should handle this)
            return -1;
        }
    }

    function validateMempool(
        uint256 mempoolId,
        bool isValid,
        string memory agentAddress
    ) internal onlyRegisteredAgent(agentAddress) {
        require(
            mempoolTxs[mempoolId].txData.txHash != address(0),
            "Mempool tx does not exist"
        );
        mempoolTxs[mempoolId].isValidated = isValid;
        current_mempool++;
    }

    // Determine winner: agent with closest prediction to actual price
    function _determineWinner(
        uint256 roundId,
        int256 actualPrice
    ) internal view returns (string memory) {
        PredictionRound storage round = predictionRounds[roundId];
        require(round.participants.length > 0, "No participants in round");

        string memory winner;
        uint256 smallestDiff = type(uint256).max;

        for (uint256 i = 0; i < round.participants.length; i++) {
            string memory agentAddr = round.participants[i];
            Prediction storage pred = roundPredictions[roundId][agentAddr];

            if (!pred.submitted) continue;

            // Calculate absolute difference
            uint256 diff;
            if (pred.predictedPrice > actualPrice) {
                diff = uint256(int256(pred.predictedPrice - actualPrice));
            } else {
                diff = uint256(int256(actualPrice - pred.predictedPrice));
            }

            if (diff < smallestDiff) {
                smallestDiff = diff;
                winner = agentAddr;
            }
        }

        require(bytes(winner).length > 0, "No valid winner found");
        return winner;
    }

    // Record prediction history for self-learning
    function _recordPredictionHistory(
        string memory agentAddr,
        uint256 roundId,
        int64 predicted,
        int64 actual
    ) internal {
        int256 difference = int256(predicted - actual);
        
        PredictionHistory memory history = PredictionHistory({
            roundId: roundId,
            predicted: predicted,
            actual: actual,
            difference: difference,
            timestamp: block.timestamp
        });

        agentHistory[agentAddr].push(history);
        emit HistoryRecorded(agentAddr, roundId, predicted, actual, difference);
    }

    // Update agent's bias (tendency to over/under predict)
    function _updateAgentBias(string memory agentAddr) internal {
        PredictionHistory[] storage history = agentHistory[agentAddr];
        if (history.length == 0) return;

        int256 totalBias = 0;
        uint256 count = history.length > 10 ? 10 : history.length; // Last 10 predictions

        for (uint256 i = history.length - count; i < history.length; i++) {
            totalBias += history[i].difference;
        }

        agentBias[agentAddr] = totalBias / int256(count);
    }

    // Update agent accuracy percentage
    function _updateAgentAccuracy(string memory agentAddr) internal {
        Agent storage agent = agents[agentAddr];
        if (agent.totalGuesses == 0) return;

        agent.accuracy = (agent.bestGuesses * 100) / agent.totalGuesses;
    }

    // Getter: Get full agent prediction history
    function getAgentHistory(string memory agentAddr) 
        external 
        view 
        returns (PredictionHistory[] memory) 
    {
        return agentHistory[agentAddr];
    }

    // Getter: Get recent N predictions
    function getAgentRecentHistory(string memory agentAddr, uint256 count) 
        external 
        view 
        returns (PredictionHistory[] memory) 
    {
        PredictionHistory[] storage fullHistory = agentHistory[agentAddr];
        uint256 returnCount = count > fullHistory.length ? fullHistory.length : count;
        
        PredictionHistory[] memory recent = new PredictionHistory[](returnCount);
        uint256 startIdx = fullHistory.length - returnCount;
        
        for (uint256 i = 0; i < returnCount; i++) {
            recent[i] = fullHistory[startIdx + i];
        }
        
        return recent;
    }

    // Getter: Get agent bias value
    function getAgentBias(string memory agentAddr) external view returns (int256) {
        return agentBias[agentAddr];
    }

    // Getter: Get comprehensive agent statistics
    function getAgentStats(string memory agentAddr) 
        external 
        view 
        returns (
            uint256 totalGuesses,
            uint256 bestGuesses,
            uint256 accuracy,
            int256 bias,
            uint256 historyLength
        ) 
    {
        Agent storage agent = agents[agentAddr];
        return (
            agent.totalGuesses,
            agent.bestGuesses,
            agent.accuracy,
            agentBias[agentAddr],
            agentHistory[agentAddr].length
        );
    }

    // ===== TESTING/MOCK FUNCTIONS =====
    
    // Submit a mock mempool transaction (for testing)
    function submitMockMempoolTx(uint256 gasPrice) external {
        TxData memory txData = TxData({
            txHash: address(uint160(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, current_mempool))))),
            gasPrice: gasPrice,
            blockNumber: block.number
        });
        
        mempoolTxs[current_mempool] = Mempool(
            txData,
            txData.gasPrice,
            txData.blockNumber,
            false
        );
        current_mempool++;
        emit NewMempoolTx(txData.txHash, txData.gasPrice, txData.blockNumber);
    }

    // Get current mempool count (for testing)
    function getCurrentMempoolCount() external view returns (uint256) {
        return current_mempool - 1; // current_mempool starts at 1, so count is current-1
    }
}
