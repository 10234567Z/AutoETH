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
    }

    uint256 public constant ROUND_DURATION = 60;
    uint256 public constant SUBMISSION_WINDOW = 50;

    uint256 public currentBlockNumber;
    uint256 public currentPredictionRound;

    mapping(uint256 => Block) public blockchain;
    mapping(uint256 => PredictionRound) public predictionRounds;
    mapping(uint256 => mapping(string => Prediction)) public roundPredictions;

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
        PredictionRound storage round = predictionRounds[
            currentPredictionRound
        ];

        // Auto-start new round if needed
        if (currentPredictionRound == 0 || round.finalized) {
            _startNewRound();
            round = predictionRounds[currentPredictionRound];
        }

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
        agents[agentAddress].totalGuesses++;
        agents[agentAddress].lastGuessBlock = block.number;

        emit PredictionSubmitted(
            agentAddress,
            predictedPrice,
            currentPredictionRound
        );
    }

    // Judge predictions and mine the block
    function finalizeRoundAndMineBlock(
        bytes[] memory pythPriceUpdate,
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

        // Handle empty round
        if (round.predictionCount == 0) {
            round.finalized = true;
            emit RoundFinalized(currentPredictionRound, "", 0);
            return;
        }

        // Update the price onchain
        updatePythPrice(pythPriceUpdate, priceFeedId);


        // Get actual price from Pyth and consuming it in the contract
        (int256 actualPrice , ) = readPythPrice(priceFeedId);

        round.actualPrice = actualPrice;
        round.finalized = true;

        // TODO: Determine winner (agent with closest prediction)
        string memory winner = _determineWinner(
            currentPredictionRound,
            actualPrice
        );
        round.winnerAgent = winner;

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

        predictionRounds[currentPredictionRound] = PredictionRound({
            forBlockNumber: currentBlockNumber + 1,
            startTime: block.timestamp,
            submissionDeadline: block.timestamp + SUBMISSION_WINDOW,
            predictionCount: 0,
            finalized: false,
            winnerAgent: "",
            actualPrice: 0
        });

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
    ) public  {
        bytes[] memory updateData = new bytes[](1);
        updateData[0] = priceData;
        uint feeAmount = pyth.getUpdateFee(updateData);
        try pyth.updatePriceFeeds{value: feeAmount}(updateData) {
            (int256 price, uint256 publishTime) = readPythPrice(priceFeed);
            emit PriceFeedUpdatedOnChainPyth(price);
        } catch {
            revert POI__PythUpdateFailed();
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
}
