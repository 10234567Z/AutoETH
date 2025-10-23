"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";

interface Agent {
  id: string;
  name: string;
  avatar: string;
  description: string;
  reputation: number;
  accuracy: string;
  wins: number;
  stats: {
    pendingRewards: string;
    bias: number;
    lastActive: number;
    totalPredictions: number;
  };
}

const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "walletAddress", type: "address" },
    ],
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
    inputs: [
      { internalType: "address", name: "walletAddress", type: "address" },
    ],
    name: "getAgentCountByWallet",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "agentAddress", type: "string" }],
    name: "getAgentStats",
    outputs: [
      { internalType: "uint256", name: "totalGuesses", type: "uint256" },
      { internalType: "uint256", name: "bestGuesses", type: "uint256" },
      { internalType: "uint256", name: "accuracy", type: "uint256" },
      { internalType: "uint256", name: "lastGuessBlock", type: "uint256" },
      { internalType: "uint256", name: "pendingReward", type: "uint256" },
      { internalType: "int256", name: "bias", type: "int256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// ---------- FULL-WIDTH AGENT CARD ----------
const AgentCard = ({
  agent,
  onDelete,
}: {
  agent: Agent;
  onDelete: (id: string) => void;
}) => {
  const pending = Number(agent.stats.pendingRewards || 0);
  const showPending = pending > 0;
  const showBias = Number(agent.stats.bias || 0) !== 0;

  return (
    <div className="w-full bg-gradient-to-r from-[#101522]/90 to-[#0c101c]/90 border border-white/10 rounded-2xl p-6 mb-6 shadow-lg hover:shadow-purple-600/30 transition-all duration-300 backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-shrink-0">
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-24 h-24 rounded-2xl border-2 border-purple-600/30 shadow-inner"
          />
        </div>

        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                {agent.name}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {agent.description || "No description available"}
              </p>
            </div>
            <div className="mt-3 sm:mt-0 text-right">
              <span className="text-xs text-gray-400 block">Reputation</span>
              <span className="font-mono text-xl font-bold text-purple-400">
                {agent.reputation}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <div className="bg-purple-600/10 border border-purple-500/20 text-purple-300 px-3 py-1.5 rounded-full">
              🎯 Accuracy:{" "}
              <span className="font-semibold">{agent.accuracy}</span>
            </div>
            <div className="bg-green-600/10 border border-green-500/20 text-green-300 px-3 py-1.5 rounded-full">
              🏆 Wins: <span className="font-semibold">{agent.wins}</span>
            </div>
            <div className="bg-blue-600/10 border border-blue-500/20 text-blue-300 px-3 py-1.5 rounded-full">
              📈 Predictions:{" "}
              <span className="font-semibold">
                {agent.stats.totalPredictions}
              </span>
            </div>
            {showPending && (
              <div className="bg-yellow-600/10 border border-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded-full">
                ⛳ Pending:{" "}
                <span className="font-semibold">{pending.toFixed(2)} POI</span>
              </div>
            )}
            {showBias && (
              <div className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full">
                ↔ Bias:{" "}
                <span className="font-semibold">
                  {agent.stats.bias > 0 ? "+" : ""}
                  {agent.stats.bias}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- BASE SEPOLIA NETWORK HELPERS ----------
const ensureBaseSepoliaNetwork = async (anyWindow: any) => {
  const BASE_SEPOLIA_CHAIN_ID = "0x14a34"; // 84532

  const chainId = await anyWindow.ethereum.request({ method: "eth_chainId" });
  if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
    try {
      await anyWindow.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
      });
      console.log("✅ Switched to Base Sepolia");
    } catch (switchErr: any) {
      if (switchErr.code === 4902) {
        await anyWindow.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: BASE_SEPOLIA_CHAIN_ID,
              chainName: "Base Sepolia",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://sepolia.base.org"],
              blockExplorerUrls: ["https://sepolia.basescan.org"],
            },
          ],
        });
      } else throw switchErr;
    }
  }
};

// ---------- MAIN PAGE ----------
const AgentsPage = () => {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const anyWindow: any = window;
    if (anyWindow.ethereum) {
      anyWindow.ethereum
        .request({ method: "eth_accounts" })
        .then(async (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setWalletConnected(true);
            setWalletAddress(accounts[0]);
            await ensureBaseSepoliaNetwork(anyWindow);
            fetchAgentsByWallet(accounts[0]);
          }
        })
        .catch(console.error);
    }
  }, []);

  const connectWallet = async () => {
    const anyWindow: any = window;
    if (!anyWindow.ethereum) {
      alert("No Ethereum wallet found. Install MetaMask or Coinbase Wallet.");
      return;
    }
    try {
      const accounts = await anyWindow.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
        await ensureBaseSepoliaNetwork(anyWindow);
        await fetchAgentsByWallet(accounts[0]);
      }
    } catch (err: any) {
      console.error("Wallet connection failed:", err);
      setError("Failed to connect wallet.");
    }
  };

  const fetchAgentsByWallet = async (addr: string) => {
    setError(null);
    setLoading(true);
    try {
      const anyWindow: any = window;
      let provider;

      if (anyWindow.ethereum) {
        await ensureBaseSepoliaNetwork(anyWindow);
        if ((ethers as any).BrowserProvider) {
          provider = new (ethers as any).BrowserProvider(anyWindow.ethereum);
        } else {
          provider = new (ethers as any).providers.Web3Provider(
            anyWindow.ethereum
          );
        }
      } else {
        setError("No wallet found.");
        return;
      }

      if (!CONTRACT_ADDRESS) {
        setError("Contract address not configured.");
        return;
      }

      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );
      console.log("Fetching agents for wallet:", addr);

      const agentDetails = await contract.getAgentDetailsByWallet(addr);
      console.log("Agent details:", agentDetails);

      const results: Agent[] = await Promise.all(
        agentDetails.map(async (agent: any) => {
          const stats = await contract.getAgentStats(agent.agentAddress);

          const accuracyPct =
            agent.totalGuesses > 0
              ? `${((agent.bestGuesses * 100) / agent.totalGuesses).toFixed(
                  1
                )}%`
              : "0%";

          const pendingRewards = ethers.formatEther(stats.pendingReward || "0");

          return {
            id: agent.agentAddress,
            name: `Agent ${agent.agentAddress.slice(0, 8)}...`,
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
              agent.agentAddress
            )}`,
            description: `${Number(agent.totalGuesses)} preds • ${accuracyPct}`,
            reputation: Number(agent.totalGuesses),
            accuracy: accuracyPct,
            wins: Number(agent.bestGuesses),
            stats: {
              pendingRewards,
              bias: Number(stats.bias || 0),
              lastActive: Number(agent.lastGuessBlock || 0),
              totalPredictions: Number(agent.totalGuesses || 0),
            },
          };
        })
      );

      setAgents(results);
    } catch (e: any) {
      console.error("Error fetching agents:", e);
      setError(e?.reason || e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAgent = (id: string) =>
    setAgents((p) => p.filter((a) => a.id !== id));

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#141827] via-[#0f1220] to-[#0a0b12] py-20 px-6 text-white">
      <Sidebar activePage="agents" />
      <div className="max-w-6xl mx-auto ml-20">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">Manage Agents</h1>
          <div className="flex items-center gap-4">
            {!walletConnected ? (
              <button
                onClick={connectWallet}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-semibold transition-all"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="text-sm text-gray-300 font-mono truncate max-w-xs"></div>
            )}
            <button
              onClick={() => router.push("/onboarding")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-semibold transition-all flex items-center gap-2"
            >
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add New
            </button>
          </div>
        </div>

        {loading && <div className="text-gray-400 mb-4">Loading agents…</div>}
        {error && <div className="text-red-400 mb-4">{error}</div>}

        <div className="space-y-4">
          {agents.length === 0 && !loading ? (
            <div className="text-gray-400 text-center py-10">
              No on-chain agents found for this wallet.
            </div>
          ) : (
            agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onDelete={handleDeleteAgent}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default AgentsPage;
