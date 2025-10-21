"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

interface Agent {
  id: string; // agent address (string id from contract)
  name: string;
  avatar: string;
  description: string;
  reputation: number;
  accuracy: string;
  wins: number;
}

// Minimal contract info (read-only)
const CONTRACT_ADDRESS = "0x6b4376c102bdd8254dfcd01e6347a9e30d52400a";
const CONTRACT_ABI = [
  {
    inputs: [],
    name: "getLeaderboard",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "agentAddress", type: "address" },
    ],
    name: "getAgent",
    outputs: [
      {
        components: [
          { internalType: "address", name: "agentAddress", type: "address" },
          {
            internalType: "address",
            name: "agentWalletAddress",
            type: "address",
          },
          { internalType: "uint256", name: "totalGuesses", type: "uint256" },
          { internalType: "uint256", name: "bestGuesses", type: "uint256" },
          { internalType: "uint256", name: "accuracy", type: "uint256" },
          { internalType: "uint256", name: "lastGuessBlock", type: "uint256" },
          { internalType: "uint256", name: "deviation", type: "uint256" },
        ],
        internalType: "struct ProofOfIntelligence.Agent",
        name: "agent",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];


const AgentCard = ({
  agent,
  onDelete,
}: {
  agent: Agent;
  onDelete: (id: string) => void;
}) => (
  <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-4 mb-4">
        <img
          src={agent.avatar}
          alt={agent.name}
          className="w-16 h-16 rounded-full border-2 border-purple-500"
        />
        <div>
          <h3 className="text-xl font-bold text-white">{agent.name}</h3>
          <p className="text-sm text-gray-400">{agent.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center text-sm mb-4">
        <div>
          <div className="font-bold text-purple-400">Reputation</div>
          <div className="text-white">{agent.reputation}</div>
        </div>
        <div>
          <div className="font-bold text-green-400">Accuracy</div>
          <div className="text-white">{agent.accuracy}</div>
        </div>
        <div>
          <div className="font-bold text-yellow-400">Wins</div>
          <div className="text-white">{agent.wins}</div>
        </div>
      </div>
    </div>
    <div className="flex justify-end gap-2 mt-4">
      <button className="text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-1 rounded-md transition-all">
        Edit
      </button>
      <button
        onClick={() => onDelete(agent.id)}
        className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-1 rounded-md transition-all"
      >
        Delete
      </button>
    </div>
  </div>
);

const AddAgentModal = ({
  onAdd,
  onClose,
}: {
  onAdd: (agent: Agent) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!name || !description) return;
    const newAgent: Agent = {
      id: Date.now().toString(),
      name,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      description,
      reputation: Math.floor(Math.random() * 100) + 800,
      accuracy: `${(Math.random() * 10 + 85).toFixed(1)}%`,
      wins: Math.floor(Math.random() * 5),
    };
    onAdd(newAgent);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Add New Agent</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Agent Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-purple-500"
          />
          <textarea
            placeholder="Agent Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-purple-500"
            rows={3}
          ></textarea>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-md transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-semibold transition-all"
          >
            Add Agent
          </button>
        </div>
      </div>
    </div>
  );
};

const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const anyWindow: any = window;
    if (anyWindow.ethereum) {
      anyWindow.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            setWalletConnected(true);
            setWalletAddress(accounts[0]);
            fetchAgentsByWallet(accounts[0]);
          }
        })
        .catch((e: any) => console.error(e));
    }
  }, []);

  const connectWallet = async () => {
    const anyWindow: any = window;
    if (!anyWindow.ethereum) {
      alert("No Ethereum provider found. Install MetaMask.");
      return;
    }
    try {
      const accounts = await anyWindow.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
        fetchAgentsByWallet(accounts[0]);
      }
    } catch (e: any) {
      console.error(e);
      setError("Failed to connect wallet");
    }
  };

  const fetchAgentsByWallet = async (addr: string) => {
    setError(null);
    setLoading(true);
    try {
      const anyWindow: any = window;
      // Use user's provider for read calls (no tx required)
      let provider;
      const ethersAny: any = ethers;

      if (anyWindow.ethereum) {
        if (ethersAny.BrowserProvider) {
          // ethers v6
          provider = new ethersAny.BrowserProvider(anyWindow.ethereum);
        } else if (ethersAny.providers?.Web3Provider) {
          // ethers v5
          provider = new ethersAny.providers.Web3Provider(anyWindow.ethereum);
        }
      }

      // Fallback to default provider if needed
      if (!provider) {
        provider =
          ethersAny.getDefaultProvider?.() || ethers.getDefaultProvider();
      }

      const contract = new ethersAny.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      console.log("Fetching agents for wallet:", addr);
      const results: Agent[] = [];

      // First try to get this wallet's registered agent directly
      try {
        // Try the wallet address as agent ID first
        const directAgent = await contract.getAgent(addr);
        console.log("Looking for agent with wallet:", addr);
        console.log("Direct agent lookup result:", directAgent);

        if (directAgent && directAgent.agentWalletAddress) {
          const cleanWalletAddr = directAgent.agentWalletAddress.toLowerCase();
          const cleanInputAddr = addr.toLowerCase();
          if (cleanWalletAddr === cleanInputAddr) {
            results.push({
              id: directAgent.agentAddress || addr,
              name: directAgent.agentAddress || "Your Agent",
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                addr
              )}`,
              description: `Your registered agent`,
              reputation: Math.floor(Math.random() * 200) + 800,
              accuracy:
                Number(directAgent.accuracy || 0) > 0
                  ? `${directAgent.accuracy}%`
                  : "0%",
              wins: Number(directAgent.bestGuesses || 0),
            });
          }
        }
      } catch (directErr) {
        console.log(
          "No agent found by direct lookup, checking leaderboard...",
          directErr
        );
      }

      // Also check leaderboard for any other agents owned by this wallet
      const leaderboard: string[] = await contract.getLeaderboard();
      console.log("Got leaderboard:", leaderboard);

      for (const agentAddr of leaderboard) {
        const a = await contract.getAgent(agentAddr);
        const [
          agentAddress,
          agentWalletAddr,
          totalGuesses,
          bestGuesses,
          accuracy,
        ] = a;
if (agentWalletAddr.toLowerCase() === addr.toLowerCase()) {
  results.push({
    id: agentAddress,
    name: agentAddress.slice(0, 8) + "...",
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${agentAddress}`,
    description: `On-chain agent registered to ${agentWalletAddr}`,
    reputation: Math.floor(Math.random() * 200) + 800,
    accuracy: `${accuracy}%`,
    wins: Number(bestGuesses),
  });
}
        try {
          console.log("Checking leaderboard agent:", agentAddr);
          const a = await contract.getAgent(agentAddr);
          console.log("Agent data:", a);

          // a is tuple: [agentAddress, agentWalletAddress, totalGuesses, bestGuesses, accuracy, lastGuessBlock, deviation]
          const [
            agentAddress,
            agentWalletAddr,
            totalGuesses,
            bestGuesses,
            accuracy,
            lastGuessBlock,
            deviation,
          ] = a;

          // Clean and normalize the wallet address
          const cleanWalletAddr = agentWalletAddr?.toLowerCase?.() || "";
          const cleanInputAddr = addr?.toLowerCase?.() || "";

          console.log("Comparing wallets for", agentAddr, {
            agent: cleanWalletAddr,
            connected: cleanInputAddr,
            matches: cleanWalletAddr === cleanInputAddr,
          });

          if (cleanWalletAddr && cleanWalletAddr === cleanInputAddr) {
            const totalGuessesNum = Number(totalGuesses || 0);
            const bestGuessesNum = Number(bestGuesses || 0);
            const accuracyPct =
              totalGuessesNum > 0
                ? ((bestGuessesNum * 100) / totalGuessesNum).toFixed(1) + "%"
                : "0%";

            results.push({
              id: agentAddr,
              name: agentAddr, // no human name on-chain; show agent address. You can map to Agentverse later.
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                agentAddr
              )}`,
              description: `On-chain agent ${agentAddr}`,
              reputation: Math.floor(Math.random() * 200) + 800,
              accuracy: accuracyPct,
              wins: bestGuesses,
            });
          }
        } catch (innerErr) {
          console.warn("Failed to fetch agent", agentAddr, innerErr);
        }
      }

      setAgents(results);
    } catch (e: any) {
      console.error("Error fetching agents:", e);
      const errMsg = e?.reason || e?.message || String(e);
      console.error("Error details:", e);
      setError(errMsg);

      // If no agents found, this could be a provider/network issue
      const anyWindow: any = window;
      if (agents.length === 0 && anyWindow.ethereum) {
        try {
          // Create a fresh provider just for network check
          const ethersAny: any = ethers;
          const checkProvider = ethersAny.BrowserProvider
            ? new ethersAny.BrowserProvider(anyWindow.ethereum)
            : new ethersAny.providers.Web3Provider(anyWindow.ethereum);

          const network = await checkProvider.getNetwork();
          console.log("Current network:", network);
          const chainId =
            typeof network.chainId === "number"
              ? network.chainId
              : Number(network.chainId);
          if (chainId !== 11155111) {
            setError(
              `Please switch to Sepolia network. Current network ID: ${chainId}`
            );
            // Try to switch network
            await anyWindow.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0xaa36a7" }], // Sepolia
            });
            // After switch, trigger a refresh
            await fetchAgentsByWallet(addr);
          }
        } catch (netErr) {
          console.warn("Network check failed:", netErr);
          if (netErr?.code === 4902) {
            // Chain not added
            try {
              await anyWindow.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0xaa36a7",
                    chainName: "Sepolia",
                    nativeCurrency: {
                      name: "ETH",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://eth-sepolia.g.alchemy.com/v2/demo"],
                    blockExplorerUrls: ["https://sepolia.etherscan.io/"],
                  },
                ],
              });
              // After adding, trigger a refresh
              await fetchAgentsByWallet(addr);
            } catch (addErr) {
              console.error("Failed to add Sepolia:", addErr);
            }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = (newAgent: Agent) => {
    setAgents((prev) => [newAgent, ...prev]);
  };

  const handleDeleteAgent = (id: string) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      setAgents((prev) => prev.filter((agent) => agent.id !== id));
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#0A0B0F] py-20 px-4 text-white">
      <div className="max-w-7xl mx-auto">
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
              <div className="text-sm text-gray-300">
                Connected: <span className="font-mono">{walletAddress}</span>
              </div>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
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

        {loading && (
          <div className="text-gray-400 mb-4">Loading agents on-chain...</div>
        )}
        {error && <div className="text-red-400 mb-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {agents.length === 0 && !loading ? (
            <div className="text-gray-400">
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

      {isModalOpen && (
        <AddAgentModal
          onAdd={handleAddAgent}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </main>
  );
};

export default AgentsPage;
