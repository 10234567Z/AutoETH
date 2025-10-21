"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

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

const CONTRACT_ADDRESS = "0x57b91375619a285f349efa85a390f06bc0ead4d6";
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

      // Fetch latest blocks (10)
      const rawBlocks = await contract.getLatestBlocks(10);
      const parsedBlocks: OnchainBlock[] = rawBlocks.map((b: any) => ({
        blockNumber: Number(b.blockNumber),
        timestamp: Number(b.timestamp),
        minerAgent: String(b.minerAgent),
        blockHash:
          typeof b.blockHash === "string"
            ? b.blockHash
            : b.blockHash
            ? b.blockHash.toString()
            : "",
        previousBlockHash:
          typeof b.previousBlockHash === "string"
            ? b.previousBlockHash
            : b.previousBlockHash
            ? b.previousBlockHash.toString()
            : "",
        targetPrice: Number(b.targetPrice || 0),
      }));

      setBlocks(parsedBlocks);

      // Fetch mempool count
      let mempoolCount = 0;
      try {
        const cnt = await contract.getCurrentMempoolCount();
        mempoolCount = Number(cnt || 0);
      } catch (e) {
        // if function missing, skip
        mempoolCount = 0;
      }

      const pools: MempoolSnapshot[] = [];
      if (mempoolCount > 0) {
        // Fetch full range
        const rawPools = await contract.getMempoolTransactions(
          0,
          mempoolCount - 1
        );
        rawPools.forEach((p: any, idx: number) => {
          // p expected to have txData, gasPrice, blockNumber, isValidated
          const txData = p.txData || {};
          const txHash = txData.txHash
            ? txData.txHash
            : txData[0]
            ? txData[0]
            : "";
          const item: MempoolItem = {
            txHash: txHash.toString(),
            gasPrice: Number(p.gasPrice || 0),
            blockNumber: Number(p.blockNumber || 0),
            isValidated: Boolean(p.isValidated),
          };
          pools.push({ id: idx, txs: [item] });
        });
      }

      setMempools(pools);
    } catch (e: any) {
      console.error("Error fetching on-chain data", e);
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#0A0B0F] py-20 px-4 text-white">
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
