"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ModelViewer from "../../components/ModelViewer";
import "./dashboard.css";
import { useWallet } from "../../context/WalletContext";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "wallet", type: "address" }],
    name: "getAgentDetailsByWallet",
    outputs: [
      {
        components: [
          { internalType: "string", name: "agentAddress", type: "string" },
          {
            internalType: "string",
            name: "agentWalletAddress",
            type: "string",
          },
          { internalType: "uint256", name: "totalGuesses", type: "uint256" },
          { internalType: "uint256", name: "bestGuesses", type: "uint256" },
          { internalType: "uint256", name: "accuracy", type: "uint256" },
          { internalType: "uint256", name: "lastGuessBlock", type: "uint256" },
          { internalType: "uint256", name: "deviation", type: "uint256" },
        ],
        internalType: "struct ProofOfIntelligence.Agent[]",
        name: "",
        type: "tuple[]",
      },
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
  {
    inputs: [],
    name: "currentBlockNumber",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentPredictionRound",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

interface AgentStats {
  totalAgents: number;
  totalPredictions: number;
  bestPredictions: number;
  averageAccuracy: number;
  pendingRewards: string;
}

const Dashboard = () => {
  const { walletAddress } = useWallet();
  const [agentStats, setAgentStats] = useState<AgentStats>({
    totalAgents: 0,
    totalPredictions: 0,
    bestPredictions: 0,
    averageAccuracy: 0,
    pendingRewards: "0",
  });
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      fetchAgentStats();
    }
  }, [walletAddress]);

  async function fetchAgentStats() {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      // Fetch agent details
      const agents = await contract.getAgentDetailsByWallet(walletAddress);

      let totalPredictions = 0;
      let totalBest = 0;
      let totalAccuracy = 0;
      let totalRewards = BigInt(0);

      for (const agent of agents) {
        totalPredictions += Number(agent.totalGuesses || 0);
        totalBest += Number(agent.bestGuesses || 0);
        totalAccuracy += Number(agent.accuracy || 0);

        // Fetch pending rewards for each agent
        try {
          const rewards = await contract.getPendingRewards(agent.agentAddress);
          totalRewards += BigInt(rewards);
        } catch (e) {
          console.error("Error fetching rewards:", e);
        }
      }

      // Fetch current block and round
      const [blockNum, roundNum] = await Promise.all([
        contract.currentBlockNumber(),
        contract.currentPredictionRound(),
      ]);

      setAgentStats({
        totalAgents: agents.length,
        totalPredictions,
        bestPredictions: totalBest,
        averageAccuracy:
          agents.length > 0 ? Math.round(totalAccuracy / agents.length) : 0,
        pendingRewards: ethers.formatEther(totalRewards),
      });

      setCurrentBlock(Number(blockNum));
      setCurrentRound(Number(roundNum));
    } catch (error) {
      console.error("Error fetching agent stats:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0B0F]">
      <Sidebar activePage="dashboard" />

      <main className="ml-16 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            AutoETH Dashboard
          </h1>
          <p className="text-gray-500 text-lg">
            Welcome back! Here's your AI agent performance overview
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 3D Model - Takes 2 columns */}
          <div className="lg:col-span-2 bg-[#13141B] border border-[#1F2937] rounded-xl p-6">
            <div className="h-[500px]">
              <ModelViewer />
            </div>
          </div>

          {/* Stats Cards - Takes 1 column */}
          <div className="space-y-6">
            {/* Wallet Info Card */}
            <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Wallet Info
              </h3>
              {walletAddress ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      Connected Address
                    </p>
                    <p className="font-mono text-sm text-white bg-[#0A0B0F] px-3 py-2 rounded-lg truncate border border-[#1F2937]">
                      {walletAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-emerald-500">Connected</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  Connect your wallet to view details
                </div>
              )}
            </div>

            {/* Network Stats Card */}
            <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
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
                Network Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Current Block</span>
                  <span className="text-white font-bold text-lg">
                    {currentBlock}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Current Round</span>
                  <span className="text-white font-bold text-lg">
                    {currentRound}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#1F2937]">
                  <span className="text-gray-500 text-sm">Network</span>
                  <span className="text-blue-400 font-semibold text-sm">
                    Base Sepolia
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics - Full Width */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Agents */}
          <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-6 hover:border-[#2D3748] transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#1F2937] rounded-xl">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">
              {agentStats.totalAgents}
            </h3>
            <p className="text-gray-500 text-sm font-medium">Total Agents</p>
          </div>

          {/* Total Predictions */}
          <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-6 hover:border-[#2D3748] transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#1F2937] rounded-xl">
                <svg
                  className="w-6 h-6 text-gray-400"
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
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">
              {agentStats.totalPredictions}
            </h3>
            <p className="text-gray-500 text-sm font-medium">
              Total Predictions
            </p>
          </div>

          {/* Best Predictions */}
          <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-6 hover:border-[#2D3748] transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#1F2937] rounded-xl">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">
              {agentStats.bestPredictions}
            </h3>
            <p className="text-gray-500 text-sm font-medium">
              Best Predictions
            </p>
          </div>

          {/* Average Accuracy */}
          <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-6 hover:border-[#2D3748] transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-[#1F2937] rounded-xl">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">
              {agentStats.averageAccuracy}%
            </h3>
            <p className="text-gray-500 text-sm font-medium">
              Average Accuracy
            </p>
          </div>
        </div>

        {/* Rewards Section */}
        <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#1F2937] rounded-xl">
                <svg
                  className="w-7 h-7 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Pending Rewards
                </h3>
                <p className="text-gray-500 text-sm">
                  POI tokens ready to claim
                </p>
              </div>
            </div>
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition-colors duration-200">
              Claim Rewards
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-white">
              {parseFloat(agentStats.pendingRewards).toFixed(4)}
            </span>
            <span className="text-2xl text-gray-400 font-semibold">POI</span>
          </div>
          {loading && (
            <div className="mt-4 flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading stats...</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
