// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

interface IPOIToken {
    function mint(address to, uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ProofOfIntelligence {

    address contractAddress = 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729;
    IPyth pyth = IPyth(contractAddress);
    
    IPOIToken public poiToken;
    
    // Reward amounts in POI tokens (18 decimals)
    uint256 public constant WINNER_REWARD = 100 * 10**18; // 100 POI
    uint256 public constant PARTICIPANT_REWARD = 10 * 10**18; // 10 POI

    struct Agent {
        string agentAddress;
        string agentWalletAddress;
        uint256 totalGuesses;
        uint256 bestGuesses;
        uint256 accuracy; // percentage of correct guesses
        uint256 lastGuessBlock;
        uint256 deviation; // Fixed deviation value (0-100) for randomization
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
    
    // Rewards mappings
    mapping(string => uint256) public pendingRewards; // Agent address => pending POI tokens

    uint256 public current_mempool = 0;

    mapping(string => Agent) public agents;
    mapping(uint256 => Mempool) public mempoolTxs;
    string[] public top10Agents;
    
    // Wallet to agent addresses mapping
    mapping(address => string[]) public walletToAgents;

    error POI__NotRegisteredAgent();
    error POI__InvalidPrediction();
    error POI__MempoolTxNotExist();
    error POI__PythUpdateFailed();
    error POI__NoNewPriceData();
    error POI__NoRewardsToClaim();
    error POI__RewardTransferFailed();

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
    event RewardsDistributed(
        uint256 indexed roundId,
        string indexed winner,
        uint256 winnerReward,
        uint256 participantReward
    );
    event RewardsClaimed(
        string indexed agentAddress,
        uint256 amount
    );

    constructor(address _poiTokenAddress) {
        require(_poiTokenAddress != address(0), "Invalid token address");
        poiToken = IPOIToken(_poiTokenAddress);
        
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
        
        // Add agent to wallet mapping
        address wallet = parseAddress(agent.agentWalletAddress);
        walletToAgents[wallet].push(agent.agentAddress);
        
        emit AgentRegistered(agent.agentAddress, agent.agentWalletAddress);
    }

    function getAgent(
        string memory agentAddress
    ) external view returns (Agent memory) {
        return agents[agentAddress];
    }

    function isCurrentMempoolValidated() public view returns (bool) {
        // current_mempool is a count, so if 0, no mempool exists
        if (current_mempool == 0) return false;
        
        // Check the last mempool (at index current_mempool - 1)
        uint256 lastIndex = current_mempool - 1;
        if (mempoolTxs[lastIndex].txData.txHash == address(0)) return false;
        return mempoolTxs[lastIndex].isValidated;
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
        // Check that at least one ACTUAL mempool transaction exists (not just counter)
        require(_hasValidMempoolTransactions(), "No mempool transactions available");
        
        // CRITICAL: Current mempool must NOT be validated yet (must be fresh/new)
        require(!isCurrentMempoolValidated(), "Current mempool already validated - submit new mempool tx first");
        
        // Check if previous round exists and had predictions
        if (currentPredictionRound > 0) {
            PredictionRound storage prevRound = predictionRounds[currentPredictionRound];
            require(prevRound.finalized, "Previous round still active");
        }
        
        _startNewRound();
    }
    
    // Check if any actual mempool transactions exist
    function _hasValidMempoolTransactions() internal view returns (bool) {
        // current_mempool is a count, so if 0, no mempools exist
        if (current_mempool == 0) return false;
        
        // Check if at least one mempool tx exists (iterate from 0 to current_mempool - 1)
        for (uint256 i = 0; i < current_mempool; i++) {
            if (mempoolTxs[i].txData.txHash != address(0)) {
                return true;
            }
        }
        
        return false;
    }

    // Judge predictions and mine the block
    function finalizeRoundAndMineBlock(
        bytes32 priceFeedId
    ) external {
        PredictionRound storage round = predictionRounds[
            currentPredictionRound
        ];

        require(!round.finalized, "Already finalized");
        require(
            block.timestamp > round.submissionDeadline,
            "Still accepting predictions"
        );

        // Handle empty round first (do NOT validate mempool if no predictions)
        if (round.predictionCount == 0) {
            round.finalized = true;
            emit RoundFinalized(currentPredictionRound, "", 0);
            return;
        }

        // Validate all pending mempool transactions (mark them as validated)
        // Only validate when the round had predictions and is being finalized.
        _validatePendingMempoolTransactions();

        // Read current on-chain price from Pyth
        (int256 actualPrice, ) = readPythPrice(priceFeedId);
        require(actualPrice > 0, "Could not get valid price");

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
                
                // Update leaderboard after stats are updated
                _updateLeaderboard(agentAddr);
            }
        }
        
        // Distribute rewards
        _distributeRewards(currentPredictionRound, winner);

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

    /**
     * @dev Update leaderboard with agent's new stats
     * Maintains a sorted top 10 list by accuracy
     * @param agentAddress The agent to potentially add/update in leaderboard
     */
    function _updateLeaderboard(string memory agentAddress) internal {
        Agent storage agent = agents[agentAddress];
        uint256 len = top10Agents.length;
        
        // Check if agent is already in leaderboard
        int256 currentPosition = -1;
        for (uint256 i = 0; i < len; i++) {
            if (keccak256(bytes(top10Agents[i])) == keccak256(bytes(agentAddress))) {
                currentPosition = int256(i);
                break;
            }
        }
        
        // If leaderboard not full, add agent
        if (len < 10) {
            if (currentPosition == -1) {
                top10Agents.push(agentAddress);
                _sortLeaderboard();
                emit LeaderboardUpdated(top10Agents);
            } else {
                // Agent already in list, just resort
                _sortLeaderboard();
                emit LeaderboardUpdated(top10Agents);
            }
            return;
        }
        
        // Leaderboard is full (10 agents)
        if (currentPosition != -1) {
            // Agent already in top 10, resort
            _sortLeaderboard();
            emit LeaderboardUpdated(top10Agents);
            return;
        }
        
        // Agent not in top 10, check if they should be
        // Compare with the worst agent (last in sorted list after sorting)
        _sortLeaderboard();
        Agent storage worstAgent = agents[top10Agents[9]];
        
        // Replace if new agent has better accuracy, or same accuracy but more guesses
        if (agent.accuracy > worstAgent.accuracy || 
            (agent.accuracy == worstAgent.accuracy && agent.totalGuesses > worstAgent.totalGuesses)) {
            top10Agents[9] = agentAddress;
            _sortLeaderboard();
            emit LeaderboardUpdated(top10Agents);
        }
    }
    
    /**
     * @dev Sort leaderboard by accuracy (descending)
     * Uses bubble sort (fine for only 10 items)
     */
    function _sortLeaderboard() internal {
        uint256 len = top10Agents.length;
        if (len <= 1) return;
        
        // Bubble sort - descending order by accuracy
        for (uint256 i = 0; i < len - 1; i++) {
            for (uint256 j = 0; j < len - i - 1; j++) {
                Agent storage agent1 = agents[top10Agents[j]];
                Agent storage agent2 = agents[top10Agents[j + 1]];
                
                // Sort by accuracy (descending), then by bestGuesses as tiebreaker
                if (agent1.accuracy < agent2.accuracy || 
                    (agent1.accuracy == agent2.accuracy && agent1.bestGuesses < agent2.bestGuesses)) {
                    // Swap
                    string memory temp = top10Agents[j];
                    top10Agents[j] = top10Agents[j + 1];
                    top10Agents[j + 1] = temp;
                }
            }
        }
    }

    function readPythPrice(
        bytes32 priceFeed
    ) public view returns (int256, uint256) {
        PythStructs.Price memory currentBasePrice = pyth.getPriceNoOlderThan(
            priceFeed,
            300 // Allow price up to 5 minutes old
        );
        return (currentBasePrice.price, currentBasePrice.publishTime);
    }

    // Validate all pending mempool transactions during finalization
    function _validatePendingMempoolTransactions() internal {
        // current_mempool is a count, validate the last mempool (at index current_mempool - 1)
        if (current_mempool == 0) return; // No mempool to validate
        
        uint256 lastIndex = current_mempool - 1;
        if (mempoolTxs[lastIndex].txData.txHash != address(0) && !mempoolTxs[lastIndex].isValidated) {
            mempoolTxs[lastIndex].isValidated = true;
        }
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

    // ===== TESTING/MOCK FUNCTIONS =====
    
    // Submit a mock mempool transaction (for testing)
    function submitMockMempoolTx(uint256 gasPrice) external {
        uint256 targetIndex;
        
        if (current_mempool == 0) {
            // First mempool - create at index 0, then increment count to 1
            targetIndex = 0;
            current_mempool = 1;
        } else {
            // Check if last mempool (at index current_mempool - 1) is validated
            uint256 lastIndex = current_mempool - 1;
            if (mempoolTxs[lastIndex].isValidated) {
                // Last mempool validated - create new one at current_mempool index and increment count
                targetIndex = current_mempool;
                current_mempool++;
            } else {
                // Last mempool not validated - overwrite it
                targetIndex = lastIndex;
            }
        }
        
        // Create transaction data
        TxData memory txData = TxData({
            txHash: address(uint160(uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, targetIndex))))),
            gasPrice: gasPrice,
            blockNumber: block.number
        });
        
        // Create or overwrite mempool transaction at target index
        mempoolTxs[targetIndex] = Mempool(
            txData,
            txData.gasPrice,
            txData.blockNumber,
            false
        );
        
        emit NewMempoolTx(txData.txHash, txData.gasPrice, txData.blockNumber);
    }
    
    // ===== REWARDS SYSTEM =====
    
    /**
     * @dev Distribute rewards to winner and participants after round finalization
     * @param roundId The round ID
     * @param winner The winning agent address
     */
    function _distributeRewards(uint256 roundId, string memory winner) internal {
        PredictionRound storage round = predictionRounds[roundId];
        
        // Reward the winner
        pendingRewards[winner] += WINNER_REWARD;
        
        // Reward all participants
        for (uint256 i = 0; i < round.participants.length; i++) {
            string memory participant = round.participants[i];
            pendingRewards[participant] += PARTICIPANT_REWARD;
        }
        
        emit RewardsDistributed(roundId, winner, WINNER_REWARD, PARTICIPANT_REWARD);
    }
    
    /**
     * @dev Claim accumulated rewards
     * @param agentAddress The agent address claiming rewards
     */
    function claimRewards(string memory agentAddress) external {
        uint256 amount = pendingRewards[agentAddress];
        
        if (amount == 0) {
            revert POI__NoRewardsToClaim();
        }
        
        // Reset pending rewards
        pendingRewards[agentAddress] = 0;
        
        // Mint and transfer POI tokens to agent's wallet
        address agentWallet = _getAgentWallet(agentAddress);
        poiToken.mint(agentWallet, amount);
        
        emit RewardsClaimed(agentAddress, amount);
    }
    
    /**
     * @dev Get agent's wallet address
     * @param agentAddress The agent address
     * @return The wallet address
     */
    function _getAgentWallet(string memory agentAddress) internal view returns (address) {
        Agent storage agent = agents[agentAddress];
        require(bytes(agent.agentAddress).length != 0, "Agent not registered");
        
        // Convert string wallet address to address type
        return parseAddress(agent.agentWalletAddress);
    }
    
    /**
     * @dev Parse string address to address type
     * @param _a The string address (e.g., "0x1234...")
     * @return The address
     */
    function parseAddress(string memory _a) internal pure returns (address) {
        bytes memory tmp = bytes(_a);
        if (tmp.length != 42) return address(0);
        
        uint160 iaddr = 0;
        uint8 b;
        for (uint i = 2; i < 42; i++) {
            uint160 iaddr_old = iaddr;
            iaddr *= 16;
            b = uint8(tmp[i]);
            if (b >= 48 && b <= 57) {
                iaddr += b - 48;
            } else if (b >= 65 && b <= 70) {
                iaddr += b - 55;
            } else if (b >= 97 && b <= 102) {
                iaddr += b - 87;
            } else {
                return address(0);
            }
            if (iaddr < iaddr_old) return address(0);
        }
        return address(iaddr);
    }
    
    /**
     * @dev Get pending rewards for an agent
     * @param agentAddress The agent address
     * @return The pending reward amount
     */
    function getPendingRewards(string memory agentAddress) external view returns (uint256) {
        return pendingRewards[agentAddress];
    }

    // ==================== GETTER FUNCTIONS ====================

    /**
     * @dev Get all blocks
     * @param startBlock Starting block number
     * @param endBlock Ending block number (inclusive)
     * @return Array of blocks
     */
    function getBlocks(uint256 startBlock, uint256 endBlock) external view returns (Block[] memory) {
        require(endBlock >= startBlock, "Invalid range");
        require(endBlock <= currentBlockNumber, "End block exceeds current");
        
        uint256 length = endBlock - startBlock + 1;
        Block[] memory blocks = new Block[](length);
        
        for (uint256 i = 0; i < length; i++) {
            blocks[i] = blockchain[startBlock + i];
        }
        
        return blocks;
    }

    /**
     * @dev Get a specific block
     * @param blockNumber The block number
     * @return The block data
     */
    function getBlock(uint256 blockNumber) external view returns (Block memory) {
        return blockchain[blockNumber];
    }

    /**
     * @dev Get latest N blocks
     * @param count Number of recent blocks to fetch
     * @return Array of blocks
     */
    function getLatestBlocks(uint256 count) external view returns (Block[] memory) {
        require(count > 0, "Count must be positive");
        
        uint256 actualCount = count;
        if (currentBlockNumber < count) {
            actualCount = currentBlockNumber + 1;
        }
        
        Block[] memory blocks = new Block[](actualCount);
        uint256 startBlock = currentBlockNumber + 1 - actualCount;
        
        for (uint256 i = 0; i < actualCount; i++) {
            blocks[i] = blockchain[startBlock + i];
        }
        
        return blocks;
    }

    /**
     * @dev Get all mempool transactions
     * @param startId Starting mempool ID
     * @param endId Ending mempool ID (inclusive)
     * @return Array of mempool transactions
     */
    function getMempoolTransactions(uint256 startId, uint256 endId) external view returns (Mempool[] memory) {
        require(endId >= startId, "Invalid range");
        require(endId < current_mempool, "End ID exceeds current");
        
        uint256 length = endId - startId + 1;
        Mempool[] memory txs = new Mempool[](length);
        
        for (uint256 i = 0; i < length; i++) {
            txs[i] = mempoolTxs[startId + i];
        }
        
        return txs;
    }

    /**
     * @dev Get a specific mempool transaction
     * @param mempoolId The mempool ID
     * @return The mempool transaction data
     */
    function getMempoolTransaction(uint256 mempoolId) external view returns (Mempool memory) {
        return mempoolTxs[mempoolId];
    }

    /**
     * @dev Get current mempool count
     * @return The current mempool ID
     */
    function getCurrentMempoolCount() external view returns (uint256) {
        return current_mempool;
    }

    /**
     * @dev Get all prediction rounds
     * @param startRound Starting round ID
     * @param endRound Ending round ID (inclusive)
     * @return Array of prediction rounds
     */
    function getPredictionRounds(uint256 startRound, uint256 endRound) external view returns (PredictionRound[] memory) {
        require(endRound >= startRound, "Invalid range");
        require(endRound <= currentPredictionRound, "End round exceeds current");
        
        uint256 length = endRound - startRound + 1;
        PredictionRound[] memory rounds = new PredictionRound[](length);
        
        for (uint256 i = 0; i < length; i++) {
            rounds[i] = predictionRounds[startRound + i];
        }
        
        return rounds;
    }

    /**
     * @dev Get a specific prediction round
     * @param roundId The round ID
     * @return The prediction round data
     */
    function getPredictionRound(uint256 roundId) external view returns (PredictionRound memory) {
        return predictionRounds[roundId];
    }

    /**
     * @dev Get current prediction round details
     * @return The current round data
     */
    function getCurrentRound() external view returns (PredictionRound memory) {
        require(currentPredictionRound > 0, "No active round");
        return predictionRounds[currentPredictionRound];
    }

    /**
     * @dev Get all predictions for a specific round
     * @param roundId The round ID
     * @return Array of agent addresses and their predictions
     */
    function getRoundPredictions(uint256 roundId) external view returns (string[] memory, Prediction[] memory) {
        PredictionRound storage round = predictionRounds[roundId];
        uint256 count = round.participants.length;
        
        string[] memory agentAddresses = new string[](count);
        Prediction[] memory predictions = new Prediction[](count);
        
        for (uint256 i = 0; i < count; i++) {
            string memory agentAddr = round.participants[i];
            agentAddresses[i] = agentAddr;
            predictions[i] = roundPredictions[roundId][agentAddr];
        }
        
        return (agentAddresses, predictions);
    }

    /**
     * @dev Get prediction for a specific agent in a specific round
     * @param roundId The round ID
     * @param agentAddress The agent address
     * @return The prediction data
     */
    function getPrediction(uint256 roundId, string memory agentAddress) external view returns (Prediction memory) {
        return roundPredictions[roundId][agentAddress];
    }

    /**
     * @dev Get all participants in a round
     * @param roundId The round ID
     * @return Array of participant agent addresses
     */
    function getRoundParticipants(uint256 roundId) external view returns (string[] memory) {
        return predictionRounds[roundId].participants;
    }

    /**
     * @dev Get agent prediction history
     * @param agentAddress The agent address
     * @return Array of prediction history entries
     */
    function getAgentHistory(string memory agentAddress) external view returns (PredictionHistory[] memory) {
        return agentHistory[agentAddress];
    }

    /**
     * @dev Get agent's last N predictions
     * @param agentAddress The agent address
     * @param count Number of recent predictions to fetch
     * @return Array of prediction history entries
     */
    function getAgentRecentHistory(string memory agentAddress, uint256 count) external view returns (PredictionHistory[] memory) {
        PredictionHistory[] storage history = agentHistory[agentAddress];
        uint256 totalCount = history.length;
        
        if (totalCount == 0) {
            return new PredictionHistory[](0);
        }
        
        uint256 actualCount = count;
        if (totalCount < count) {
            actualCount = totalCount;
        }
        
        PredictionHistory[] memory recentHistory = new PredictionHistory[](actualCount);
        uint256 startIndex = totalCount - actualCount;
        
        for (uint256 i = 0; i < actualCount; i++) {
            recentHistory[i] = history[startIndex + i];
        }
        
        return recentHistory;
    }

    /**
     * @dev Get agent's bias (average over/under prediction)
     * @param agentAddress The agent address
     * @return The bias value
     */
    function getAgentBias(string memory agentAddress) external view returns (int256) {
        return agentBias[agentAddress];
    }

    /**
     * @dev Get agent statistics
     * @param agentAddress The agent address
     * @return totalGuesses Total number of predictions
     * @return bestGuesses Number of best (winning) predictions
     * @return accuracy Accuracy percentage
     * @return lastGuessBlock Last block where agent predicted
     * @return pendingReward Pending POI token rewards
     * @return bias Average prediction bias
     */
    function getAgentStats(string memory agentAddress) external view returns (
        uint256 totalGuesses,
        uint256 bestGuesses,
        uint256 accuracy,
        uint256 lastGuessBlock,
        uint256 pendingReward,
        int256 bias
    ) {
        Agent storage agent = agents[agentAddress];
        return (
            agent.totalGuesses,
            agent.bestGuesses,
            agent.accuracy,
            agent.lastGuessBlock,
            pendingRewards[agentAddress],
            agentBias[agentAddress]
        );
    }

    /**
     * @dev Get top 10 agents leaderboard
     * @return Array of top agent addresses
     */
    function getLeaderboard() external view returns (string[] memory) {
        return top10Agents;
    }

    /**
     * @dev Get agent addresses by wallet address
     * @param wallet The wallet address to query
     * @return Array of agent addresses registered by this wallet
     */
    function getAgentsByWallet(address wallet) external view returns (string[] memory) {
        return walletToAgents[wallet];
    }

    /**
     * @dev Get full agent details by wallet address
     * @param wallet The wallet address to query
     * @return Array of Agent structs registered by this wallet
     */
    function getAgentDetailsByWallet(address wallet) external view returns (Agent[] memory) {
        string[] memory agentAddresses = walletToAgents[wallet];
        Agent[] memory agentDetails = new Agent[](agentAddresses.length);
        
        for (uint256 i = 0; i < agentAddresses.length; i++) {
            agentDetails[i] = agents[agentAddresses[i]];
        }
        
        return agentDetails;
    }

    /**
     * @dev Get count of agents registered by wallet
     * @param wallet The wallet address to query
     * @return Number of agents registered by this wallet
     */
    function getAgentCountByWallet(address wallet) external view returns (uint256) {
        return walletToAgents[wallet].length;
    }

    /**
     * @dev Get contract state summary
     * @return currentBlock Current block number
     * @return currentRound Current prediction round
     * @return mempoolCount Total mempool transactions
     * @return roundActive Whether current round is active
     * @return roundFinalized Whether current round is finalized
     */
    function getContractState() external view returns (
        uint256 currentBlock,
        uint256 currentRound,
        uint256 mempoolCount,
        bool roundActive,
        bool roundFinalized
    ) {
        bool active = currentPredictionRound > 0;
        bool finalized = active ? predictionRounds[currentPredictionRound].finalized : false;
        
        return (
            currentBlockNumber,
            currentPredictionRound,
            current_mempool,
            active,
            finalized
        );
    }
}
