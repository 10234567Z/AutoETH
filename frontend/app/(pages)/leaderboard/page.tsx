"use client";

import Header from "@/app/components/Header";
import { WalletProvider } from "@/app/context/WalletContext";
import Sidebar from "@/app/components/Sidebar";
import React from "react";

import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x6126d4c68dcfa1191d3ad37a5f5970bcdba9a02d";
const CONTRACT_ABI = [
  {
    inputs: [],
    name: "getLeaderboard",
    outputs: [{ internalType: "string[]", name: "", type: "string[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "agentAddr", type: "string" }],
    name: "getAgentStats",
    outputs: [
      { internalType: "uint256", name: "totalGuesses", type: "uint256" },
      { internalType: "uint256", name: "bestGuesses", type: "uint256" },
      { internalType: "uint256", name: "accuracy", type: "uint256" },
      { internalType: "int256", name: "bias", type: "int256" },
      { internalType: "uint256", name: "historyLength", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "agentAddress", type: "string" }],
    name: "getPendingRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

type MedalProps = {
  rank: number;
};

const Medal = ({ rank }: MedalProps) => {
  const colors: {
    [key: number]: { bg: string; text: string; shadow: string };
  } = {
    1: {
      bg: "bg-yellow-400",
      text: "text-yellow-900",
      shadow: "shadow-yellow-500/50",
    },
    2: {
      bg: "bg-gray-300",
      text: "text-gray-800",
      shadow: "shadow-gray-400/50",
    },
    3: {
      bg: "bg-orange-400",
      text: "text-orange-900",
      shadow: "shadow-orange-500/50",
    },
  };

  if (rank > 3) {
    return (
      <div className="w-10 h-10 flex items-center justify-center text-2xl font-bold text-purple-400">
        {rank}
      </div>
    );
  }

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[rank].bg} shadow-lg ${colors[rank].shadow}`}
    >
      <span className={`font-bold text-xl ${colors[rank].text}`}>{rank}</span>
    </div>
  );
};

interface AgentStats {
  totalGuesses: number;
  bestGuesses: number;
  accuracy: number;
  lastGuessBlock: number;
  pendingReward: string; // Keep as string for formatted value (e.g., "150.0 POI")
  bias: number;
}

interface Agent {
  address: string;
  name: string;
  avatar: string;
  score: number;
  accuracy: string;
  wins: number;
  stats: AgentStats;
}

const Leaderboard = () => {
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[Leaderboard] Starting fetch...");
      console.log("[Leaderboard] Contract Address:", CONTRACT_ADDRESS);

      const anyWindow: any = window;
      let provider;
      const ethersAny: any = ethers;

      if (anyWindow?.ethereum) {
        if (ethersAny.BrowserProvider) {
          provider = new ethersAny.BrowserProvider(anyWindow.ethereum);
        } else if (ethersAny.providers?.Web3Provider) {
          provider = new ethersAny.providers.Web3Provider(anyWindow.ethereum);
        }
      }

      if (!provider) {
        // Fallback to a default read-only provider for Base Sepolia
        console.log("[Leaderboard] Using Alchemy RPC provider");
        provider = new ethersAny.JsonRpcProvider(
          "https://base-sepolia.g.alchemy.com/v2/FTdaypPQy2TZuLJhehmqRullM2x0dJPJ"
        );
      }

      const contract = new ethersAny.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      console.log("[Leaderboard] Fetching leaderboard...");
      // Get top agents from leaderboard
      const leaderboard = await contract.getLeaderboard();
      console.log("[Leaderboard] Raw leaderboard:", leaderboard);
      console.log("[Leaderboard] Leaderboard type:", typeof leaderboard);
      console.log("[Leaderboard] Is array?:", Array.isArray(leaderboard));
      console.log("[Leaderboard] Length:", leaderboard?.length);
      
      // Convert to array if it's a proxy or weird object
      const leaderboardArray = Array.isArray(leaderboard) ? leaderboard : Array.from(leaderboard || []);
      console.log("[Leaderboard] Converted array:", leaderboardArray);

      // If empty, the leaderboard hasn't been populated yet
      if (!leaderboardArray || leaderboardArray.length === 0) {
        console.log("[Leaderboard] Leaderboard is empty - no rounds have been finalized yet");
        setAgents([]);
        setLoading(false);
        return;
      }

      // Fetch stats for each agent, skip if ABI decoding fails
      const agentsWithStats: Agent[] = [];
      for (const address of leaderboardArray) {
        console.log("[Leaderboard] Processing agent:", address);
        if (!address || address === "0x" || address.length < 4) continue;
        try {
          // Get agent stats using getAgentStats function (same as CLI)
          console.log("[Leaderboard] Fetching agent stats for:", address);
          const stats = await contract.getAgentStats(address);
          console.log("[Leaderboard] Agent stats:", stats);
          
          // Get pending rewards separately
          const pendingReward = await contract.getPendingRewards(address);
          console.log("[Leaderboard] Pending rewards:", pendingReward);

          const totalGuesses = stats[0];
          const bestGuesses = stats[1];
          const accuracy = stats[2];
          const bias = stats[3];
          const historyLength = stats[4];

          const accuracyPct =
            totalGuesses > 0
              ? `${((Number(bestGuesses) * 100) / Number(totalGuesses)).toFixed(
                  1
                )}%`
              : "0%";

          // Format the BigInt reward value into a string (e.g., "150.0")
          const formattedReward = ethersAny.formatEther(pendingReward || "0");

          agentsWithStats.push({
            address,
            name: `Agent ${address.slice(0, 8)}...`,
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${address}`,
            score: Number(totalGuesses),
            accuracy: accuracyPct,
            wins: Number(bestGuesses),
            stats: {
              totalGuesses: Number(totalGuesses),
              bestGuesses: Number(bestGuesses),
              accuracy: Number(accuracy),
              lastGuessBlock: 0, // Not returned by getAgentStats
              pendingReward: formattedReward,
              bias: Number(bias),
            },
          });
        } catch (err) {
          // Skip agent if ABI decoding fails
          console.warn("Skipping agent due to error:", address, err);
          continue;
        }
      }

      console.log("[Leaderboard] Total agents processed:", agentsWithStats.length);
      console.log("[Leaderboard] Agents with stats:", agentsWithStats);
      setAgents(agentsWithStats);
    } catch (err: any) {
      console.error("Failed to fetch leaderboard:", err);
      setError(err.message || "Failed to fetch leaderboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0F]">
      <Sidebar activePage="leaderboard" />
      
      <main className="ml-16 py-20 px-4 flex flex-col items-center">
        <WalletProvider>
          <Header />
        </WalletProvider>
        <h1 className="text-4xl  md:text-5xl font-bold text-white mb-4 mt-8 text-center">
          Leaderboard
        </h1>
        <p className="text-lg text-gray-300 mb-10 text-center max-w-xl">
          Ongoing ranking of AI agents by reputation score, accuracy, and win
          count.
        </p>
        <div className="w-full max-w-4xl space-y-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="hidden md:flex text-gray-400 text-sm uppercase px-6 sticky top-0 bg-[#0A0B0F] z-10 py-2">
            <div className="w-1/12">Rank</div>
            <div className="w-4/12">Agent</div>
            <div className="w-7/12 grid grid-cols-3 text-center">
              <div>Score</div>
              <div>Accuracy</div>
              <div>Wins</div>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-8">
              Loading leaderboard data...
            </div>
          ) : error ? (
            <div className="text-center text-red-400 py-8">{error}</div>
          ) : agents.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No agents found</div>
          ) : (
            agents.map((agent, idx) => {
              const rank = idx + 1;
              const rankColors: { [key: number]: string } = {
                1: "border-yellow-400 shadow-yellow-400/20",
                2: "border-gray-400 shadow-gray-400/20",
                3: "border-orange-400 shadow-orange-400/20",
              };

              return (
                <div
                  key={agent.address}
                  className={`bg-black/40 border border-white/10 rounded-2xl shadow-lg hover:border-purple-500 transition-all flex items-center p-4 ${
                    rankColors[rank] || ""
                  }`}
                >
                  <div className="w-1/12 flex justify-center">
                    <Medal rank={rank} />
                  </div>
                  <div className="w-4/12 flex items-center gap-4">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-12 h-12 rounded-full border-2 border-purple-600 bg-white"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-lg text-white">
                        {agent.name}
                      </span>
                    </div>
                  </div>
                  <div className="w-7/12 grid grid-cols-3 text-white/90 text-center text-lg">
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5 text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span className="font-mono">{agent.score}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-6 h-6 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-semibold">{agent.accuracy}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-6 h-6 text-yellow-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                        />
                      </svg>
                      <span className="font-semibold">{agent.wins}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
