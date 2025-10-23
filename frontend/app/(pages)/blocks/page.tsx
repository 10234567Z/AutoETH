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

interface MempoolItem {
  txHash: string;
  gasPrice: number;
  blockNumber: number;
  isValidated: boolean;
}

interface MempoolSnapshot {
  id: number;
  txs: MempoolItem[];
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "error";
const CONTRACT_ABI = [
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
  {
    inputs: [],
    name: "getCurrentMempoolCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "startId", type: "uint256" },
      { internalType: "uint256", name: "endId", type: "uint256" },
    ],
    name: "getMempoolTransactions",
    outputs: [
      {
        components: [
          { internalType: "tuple", name: "txData", type: "tuple" },
          { internalType: "uint256", name: "gasPrice", type: "uint256" },
          { internalType: "uint256", name: "blockNumber", type: "uint256" },
          { internalType: "bool", name: "isValidated", type: "bool" },
        ],
        internalType: "struct ProofOfIntelligence.Mempool[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const BlockCard = ({ block }: { block: OnchainBlock }) => (
  <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-4 animate-fade-in">
    <div className="flex justify-between items-center">
      <div className="font-bold text-purple-400">
        Block #{block.blockNumber}
      </div>
      <div className="text-xs text-gray-400">
        {new Date(block.timestamp * 1000).toLocaleString()}
      </div>
    </div>
    <div className="text-sm text-gray-300 mt-2">
      Hash: <span className="font-mono text-xs">{block.blockHash}</span>
    </div>
    <div className="text-sm text-gray-300 mt-1">
      Miner Agent: {block.minerAgent}
    </div>
  </div>
);

const MempoolView = ({ pool }: { pool: MempoolSnapshot }) => (
  <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-4">
    <div className="font-bold text-blue-400 mb-2">
      Mempool Snapshot #{pool.id}
    </div>
    <div className="space-y-2">
      {pool.txs.map((tx) => (
        <div key={tx.txHash} className="bg-black/50 p-2 rounded-md text-xs">
          <div className="text-gray-300">
            Hash: <span className="font-mono">{tx.txHash}</span>
          </div>
          <div className="text-gray-400">
            BlockNumber: {tx.blockNumber} | GasPrice: {tx.gasPrice}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BlocksPage = () => {
  const [blocks, setBlocks] = useState<OnchainBlock[]>([]);
  const [mempools, setMempools] = useState<MempoolSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          `Please switch to Sepolia network (current: ${chainId})`
        );
      }

      // Fetch latest blocks (10)
      const rawBlocks = await contract.getLatestBlocks(10);
      console.log("Raw blocks from chain:", rawBlocks);

      const parsedBlocks: OnchainBlock[] = rawBlocks.map((b: any) => {
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

      // Fetch mempool count and transactions from contract
      try {
        const mempoolCount = await contract.getCurrentMempoolCount();
        const count = Number(mempoolCount);
        let mempoolTxs: any[] = [];
        if (count > 0) {
          mempoolTxs = await contract.getMempoolTransactions(0, count - 1);
        }
        const pools: MempoolSnapshot[] = [];
        if (mempoolTxs && mempoolTxs.length > 0) {
          mempoolTxs.forEach((tx: any, idx: number) => {
            // Support both object and array structure
            let txObj: MempoolItem;
            if (tx.txData) {
              // Object style
              txObj = {
                txHash: tx.txData.txHash,
                gasPrice: Number(tx.txData.gasPrice ?? tx.gasPrice ?? 0),
                blockNumber: Number(
                  tx.txData.blockNumber ?? tx.blockNumber ?? 0
                ),
                isValidated: Boolean(tx.isValidated ?? false),
              };
            } else if (Array.isArray(tx) && tx.length >= 4) {
              // Array style: [txData, gasPrice, blockNumber, isValidated]
              const txData = tx[0] || {};
              txObj = {
                txHash: txData.txHash ?? "",
                gasPrice: Number(tx[1] ?? 0),
                blockNumber: Number(tx[2] ?? 0),
                isValidated: Boolean(tx[3] ?? false),
              };
            } else {
              // Fallback for unexpected structure
              txObj = {
                txHash: "",
                gasPrice: 0,
                blockNumber: 0,
                isValidated: false,
              };
            }
            pools.push({
              id: idx,
              txs: [txObj],
            });
          });
        }
        setMempools(pools);
      } catch (e) {
        console.error("Error fetching mempool from contract", e);
        setMempools([]);
      }
    } catch (e: any) {
      console.error("Error fetching on-chain data", e);
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b ml-16 from-[#1a1a2e] to-[#0A0B0F] py-20 px-4 text-white">
      <Sidebar activePage="blocks" />

      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">
          Blockchain Explorer
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Blocks Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-purple-400">
              Recent Blocks
            </h2>
            {loading && (
              <div className="text-gray-400 mb-4">
                Loading on-chain blocks...
              </div>
            )}
            {error && <div className="text-red-400 mb-4">{error}</div>}
            <div className="max-h-[80vh] overflow-y-auto pr-4">
              {blocks.map((block) => (
                <BlockCard key={block.blockNumber} block={block} />
              ))}
            </div>
          </div>

          {/* Mempool Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-blue-400">Mempool</h2>
            <div className="max-h-[80vh] overflow-y-auto pr-4">
              {mempools.map((pool) => (
                <MempoolView key={pool.id} pool={pool} />
              ))}
              {mempools.length === 0 && !loading && (
                <div className="text-gray-400">
                  No mempool data available on-chain.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BlocksPage;
