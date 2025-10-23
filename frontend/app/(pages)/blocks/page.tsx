"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import Sidebar from "../../components/Sidebar";

// --- Type Definitions ---
interface OnchainBlock {
  blockNumber: number;
  timestamp: number;
  minerAgent: string;
  blockHash: string;
  previousBlockHash: string;
  targetPrice: number;
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "error";
const CONTRACT_ABI = [
  {
    inputs: [],
    name: "currentBlockNumber",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "count", type: "uint256" }],
    name: "getLatestBlocks",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "blockNumber", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "string", name: "minerAgent", type: "string" },
          { internalType: "bytes32", name: "blockHash", type: "bytes32" },
          {
            internalType: "bytes32",
            name: "previousBlockHash",
            type: "bytes32",
          },
          { internalType: "int256", name: "targetPrice", type: "int256" },
        ],
        internalType: "struct ProofOfIntelligence.Block[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const BlockCard = ({ block }: { block: OnchainBlock }) => (
  <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-6 mb-4 hover:border-[#2D3748] transition-all duration-200">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-sm text-gray-500 mb-1">Block Number</div>
        <div className="text-2xl font-bold text-white">
          #{block.blockNumber}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-gray-500 mb-1">Timestamp</div>
        <div className="text-sm text-gray-400">
          {new Date(block.timestamp * 1000).toLocaleTimeString()}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(block.timestamp * 1000).toLocaleDateString()}
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <div>
        <div className="text-xs text-gray-500 mb-1">Block Hash</div>
        <div className="font-mono text-xs text-gray-300 bg-[#0A0B0F] px-3 py-2 rounded-lg border border-[#1F2937] truncate">
          {block.blockHash}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#1F2937]">
        <div>
          <div className="text-xs text-gray-500 mb-1">Miner Agent</div>
          <div className="text-sm font-semibold text-white">
            {block.minerAgent}
          </div>
        </div>
        {block.targetPrice > 0 && (
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Target Price</div>
            <div className="text-lg font-bold text-emerald-400">
              ${(block.targetPrice / 1e8).toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

const BlocksPage = () => {
  const [blocks, setBlocks] = useState<OnchainBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [avgBlockTime, setAvgBlockTime] = useState<number>(0);

  useEffect(() => {
    fetchOnchainData();
    const interval = setInterval(fetchOnchainData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOnchainData() {
    setLoading(true);
    setError(null);
    try {
      const anyWindow: any = window;
      const anyEthers: any = ethers;

      // Robust provider creation: support ethers v6 BrowserProvider and v5 providers.Web3Provider
      let provider: any;
      if (anyWindow?.ethereum) {
        if (typeof anyEthers.BrowserProvider === "function") {
          provider = new anyEthers.BrowserProvider(anyWindow.ethereum);
        } else if (
          anyEthers.providers &&
          typeof anyEthers.providers.Web3Provider === "function"
        ) {
          provider = new anyEthers.providers.Web3Provider(anyWindow.ethereum);
        } else if (typeof anyEthers.getDefaultProvider === "function") {
          provider = anyEthers.getDefaultProvider();
        }
      } else {
        provider =
          typeof anyEthers.getDefaultProvider === "function"
            ? anyEthers.getDefaultProvider()
            : undefined;
      }

      // Final fallback to a JsonRpcProvider if nothing else available
      if (!provider) {
        try {
          provider = new anyEthers.JsonRpcProvider();
        } catch (err) {
          provider = undefined;
        }
      }

      const contract = new anyEthers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      console.log("Fetching blocks from contract:", CONTRACT_ADDRESS);

      // Check network first
      const network = await provider.getNetwork();
      const chainId =
        typeof network.chainId === "number"
          ? network.chainId
          : Number(network.chainId);
      console.log("Current network:", chainId);

      if (chainId !== 84532) {
        throw new Error(
          `Please switch to Base Sepolia network (current: ${chainId})`
        );
      }

      // Check how many blocks exist first
      // currentBlockNumber represents the highest block number (starts at 1 for genesis)
      let currentBlock = 0;
      try {
        currentBlock = Number(await contract.currentBlockNumber());
        console.log("Current block number:", currentBlock);
      } catch (e) {
        console.warn("Could not fetch current block number:", e);
      }

      // If currentBlockNumber is 0, no blocks exist (not even genesis)
      // This shouldn't happen as constructor mines genesis, but handle it
      if (currentBlock === 0) {
        console.log("No blocks mined yet");
        setBlocks([]);
        setLoading(false);
        return;
      }

      setCurrentBlock(currentBlock);

      // Fetch latest blocks
      // currentBlockNumber = 1 means 1 block exists (genesis at blockchain[1])
      // We can safely request up to currentBlockNumber blocks
      const blocksToFetch = Math.min(10, currentBlock);

      let rawBlocks;
      try {
        rawBlocks = await contract.getLatestBlocks(blocksToFetch);
        console.log("Raw blocks from chain:", rawBlocks);
      } catch (blockError: any) {
        console.warn("Error fetching blocks:", blockError);
        rawBlocks = [];
      }

      const parsedBlocks: OnchainBlock[] = (rawBlocks || []).map((b: any) => {
        // Handle both array and object responses
        const block = Array.isArray(b)
          ? {
              blockNumber: b[0],
              timestamp: b[1],
              minerAgent: b[2],
              blockHash: b[3],
              previousBlockHash: b[4],
              targetPrice: b[5],
            }
          : b;

        return {
          blockNumber: Number(block.blockNumber || 0),
          timestamp: Number(block.timestamp || 0),
          minerAgent: String(block.minerAgent || ""),
          blockHash:
            typeof block.blockHash === "string"
              ? block.blockHash
              : block.blockHash?.toString() || "",
          previousBlockHash:
            typeof block.previousBlockHash === "string"
              ? block.previousBlockHash
              : block.previousBlockHash?.toString() || "",
          targetPrice: Number(block.targetPrice || 0),
        };
      });

      console.log("Parsed blocks:", parsedBlocks);

      setBlocks(parsedBlocks);

      // Calculate average block time
      if (parsedBlocks.length > 1) {
        const timeDiffs = [];
        for (let i = 1; i < parsedBlocks.length; i++) {
          timeDiffs.push(
            parsedBlocks[i].timestamp - parsedBlocks[i - 1].timestamp
          );
        }
        const avgTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
        setAvgBlockTime(avgTime);
      }
    } catch (e: any) {
      console.error("Error fetching on-chain data", e);
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0B0F] ml-16 py-12 px-8 text-white">
      <Sidebar activePage="blocks" />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Blockchain Explorer
          </h1>
          <p className="text-gray-500">
            Real-time view of blocks mined by AI agents
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Block */}
          <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#1F2937] rounded-lg">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div className="text-sm text-gray-500">Current Block</div>
            </div>
            <div className="text-3xl font-bold text-white">{currentBlock}</div>
          </div>

          {/* Total Blocks */}
          <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#1F2937] rounded-lg">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="text-sm text-gray-500">Blocks Displayed</div>
            </div>
            <div className="text-3xl font-bold text-white">{blocks.length}</div>
          </div>

          {/* Avg Block Time */}
          <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#1F2937] rounded-lg">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-sm text-gray-500">Avg Block Time</div>
            </div>
            <div className="text-3xl font-bold text-white">
              {avgBlockTime > 0 ? `${avgBlockTime.toFixed(0)}s` : "N/A"}
            </div>
          </div>
        </div>

        {/* Blocks List */}
        <div className="bg-[#13141B] border border-[#1F2937] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Blocks</h2>
            {loading && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Syncing...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
              <div className="text-red-400 text-sm">{error}</div>
            </div>
          )}

          <div className="max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
            {blocks.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                No blocks found. Start mining to see blocks here.
              </div>
            )}
            {blocks.map((block) => (
              <BlockCard key={block.blockNumber} block={block} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default BlocksPage;
