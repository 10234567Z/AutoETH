import { useEffect, useState } from 'react';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;  
const RPC_URL = 'https://base-sepolia.g.alchemy.com/v2/FTdaypPQy2TZuLJhehmqRullM2x0dJPJ';

const contractABI = [
  {
    inputs: [],
    name: 'currentPredictionRound',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'uint256' }],
    name: 'predictionRounds',
    outputs: [
      { type: 'uint256', name: 'forBlockNumber' },
      { type: 'uint256', name: 'startTime' },
      { type: 'uint256', name: 'submissionDeadline' },
      { type: 'uint256', name: 'predictionCount' },
      { type: 'bool', name: 'finalized' },
      { type: 'string', name: 'winnerAgent' },
      { type: 'int256', name: 'actualPrice' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'uint256', name: 'roundId' }],
    name: 'getRoundParticipants',
    outputs: [{ type: 'string[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'string', name: 'agentAddress' }],
    name: 'getAgent',
    outputs: [
      { type: 'string', name: 'agentAddress' },
      { type: 'string', name: 'agentWalletAddress' },
      { type: 'uint256', name: 'totalGuesses' },
      { type: 'uint256', name: 'bestGuesses' },
      { type: 'uint256', name: 'accuracy' },
      { type: 'uint256', name: 'lastGuessBlock' },
      { type: 'uint256', name: 'deviation' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { type: 'uint256', name: 'roundId' },
      { type: 'string', name: 'agentAddress' }
    ],
    name: 'roundPredictions',
    outputs: [
      { type: 'string', name: 'agentAddress' },
      { type: 'int256', name: 'predictedPrice' },
      { type: 'uint256', name: 'timestamp' },
      { type: 'bool', name: 'submitted' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

export interface LivePrediction {
  agentAddress: string;
  agentWallet: string;
  predictedPrice: number;
  timestamp: number;
  accuracy: number;
  totalGuesses: number;
  bestGuesses: number;
  winRate: number;
}

export interface RoundData {
  roundId: number;
  forBlockNumber: number;
  startTime: number;
  submissionDeadline: number;
  predictionCount: number;
  finalized: boolean;
  timeRemaining: number;
  status: 'active' | 'judging' | 'finalized' | 'no-round';
}

export function useLiveRound(currentPrice: number) {
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [predictions, setPredictions] = useState<LivePrediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoundData = async () => {
    try {
      // Get current round ID
      const roundId = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'currentPredictionRound',
      });

      if (roundId === BigInt(0)) {
        setRoundData({
          roundId: 0,
          forBlockNumber: 0,
          startTime: 0,
          submissionDeadline: 0,
          predictionCount: 0,
          finalized: false,
          timeRemaining: 0,
          status: 'no-round',
        });
        setPredictions([]);
        setLoading(false);
        return;
      }

      // Get round details
      const round = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'predictionRounds',
        args: [roundId],
      }) as readonly [bigint, bigint, bigint, bigint, boolean, string, bigint];

      const now = Math.floor(Date.now() / 1000);
      const timeRemaining = Math.max(0, Number(round[2]) - now);
      
      let status: 'active' | 'judging' | 'finalized' | 'no-round' = 'active';
      if (round[4]) {
        status = 'finalized';
      } else if (timeRemaining === 0) {
        status = 'judging';
      }

      setRoundData({
        roundId: Number(roundId),
        forBlockNumber: Number(round[0]),
        startTime: Number(round[1]),
        submissionDeadline: Number(round[2]),
        predictionCount: Number(round[3]),
        finalized: round[4],
        timeRemaining,
        status,
      });

      // Get participants
      const participants = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'getRoundParticipants',
        args: [roundId],
      }) as `0x${string}`[];

      // Fetch predictions for each participant
      const predictionsData: LivePrediction[] = [];

      for (const agentAddress of participants) {
        try {
          // Get agent stats
          const agent = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: contractABI,
            functionName: 'getAgent',
            args: [agentAddress],
          }) as readonly [string, string, bigint, bigint, bigint, bigint, bigint];

          // Get prediction for this round
          const prediction = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: contractABI,
            functionName: 'roundPredictions',
            args: [roundId, agentAddress],
          }) as readonly [string, bigint, bigint, boolean];

          // prediction[0] = agentAddress (string)
          // prediction[1] = predictedPrice (int256)
          // prediction[2] = timestamp (uint256)
          // prediction[3] = submitted (bool)
          
          if (prediction[3]) { // submitted
            const predictedPrice = Number(prediction[1]); // Already in ×1e8, keep it

            // Calculate live accuracy
            const accuracy = currentPrice > 0
              ? 100 - (Math.abs((predictedPrice / 1e8) - currentPrice) / currentPrice) * 100
              : 0;

            // agent[2] = totalGuesses, agent[3] = bestGuesses
            const totalGuesses = Number(agent[2]);
            const bestGuesses = Number(agent[3]);
            const winRate = totalGuesses > 0
              ? (bestGuesses / totalGuesses) * 100
              : 0;

            predictionsData.push({
              agentAddress: agentAddress,
              agentWallet: agent[1], // agentWalletAddress at index 1
              predictedPrice, // Keep as ×1e8 for display
              timestamp: Number(prediction[2]),
              accuracy,
              totalGuesses,
              bestGuesses,
              winRate,
            });
          }
        } catch (err) {
          console.error(`Error fetching data for agent ${agentAddress}:`, err);
        }
      }

      // Sort by accuracy (best first)
      predictionsData.sort((a, b) => b.accuracy - a.accuracy);
      setPredictions(predictionsData);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching round data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoundData();
    
    // Poll every 5 seconds for updates
    const interval = setInterval(fetchRoundData, 5000);
    
    return () => clearInterval(interval);
  }, [currentPrice]);

  return { roundData, predictions, loading };
}
