'use client'
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbars";

// --- Type Definitions ---
interface Block {
    height: number;
    timestamp: string;
    txCount: number;
    hash: string;
}

interface Transaction {
    hash: string;
    from: string;
}

interface Mempool {
    id: string;
    timestamp: string;
    txs: Transaction[];
}

// --- Mock Data Generation ---
const generateHash = () => `0x${[...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

const generateBlocks = (count: number, startHeight: number): Block[] => {
    return Array.from({ length: count }, (_, i) => ({
        height: startHeight - i,
        timestamp: new Date(Date.now() - i * 15000).toLocaleTimeString(),
        txCount: Math.floor(Math.random() * 150) + 50,
        hash: generateHash(),
    }));
};

const generateMempool = (): Mempool[] => {
    return Array.from({ length: 5 }, (_, i) => ({
        id: `mempool-${i}`,
        timestamp: new Date(Date.now() - i * 3000).toLocaleTimeString(),
        txs: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, () => ({
            hash: generateHash(),
            from: `0x${[...Array(10)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}...`,
        }))
    }));
};

const BlockCard = ({ block }: { block: Block }) => (
    <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-4 animate-fade-in">
        <div className="flex justify-between items-center">
            <div className="font-bold text-purple-400">Block #{block.height}</div>
            <div className="text-xs text-gray-400">{block.timestamp}</div>
        </div>
        <div className="text-sm text-gray-300 mt-2">Hash: <span className="font-mono text-xs">{block.hash}</span></div>
        <div className="text-sm text-gray-300 mt-1">Transactions: {block.txCount}</div>
    </div>
);

const MempoolView = ({ mempool }: { mempool: Mempool }) => (
    <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-4">
        <div className="font-bold text-blue-400 mb-2">Mempool Snapshot @ {mempool.timestamp}</div>
        <div className="space-y-2">
            {mempool.txs.map(tx => (
                <div key={tx.hash} className="bg-black/50 p-2 rounded-md text-xs">
                    <div className="text-gray-300">Hash: <span className="font-mono">{tx.hash}</span></div>
                    <div className="text-gray-400">From: <span className="font-mono">{tx.from}</span></div>
                </div>
            ))}
        </div>
    </div>
);

const BlocksPage = () => {
    const [latestBlockHeight, setLatestBlockHeight] = useState(1234567);
    const [blocks, setBlocks] = useState<Block[]>(() => generateBlocks(10, latestBlockHeight));
    const [mempool, setMempool] = useState<Mempool[]>(generateMempool());

    useEffect(() => {
        const interval = setInterval(() => {
            setLatestBlockHeight(prevHeight => {
                const newHeight = prevHeight + 1;
                const newBlock: Block = {
                    height: newHeight,
                    timestamp: new Date().toLocaleTimeString(),
                    txCount: Math.floor(Math.random() * 150) + 50,
                    hash: generateHash(),
                };
                setBlocks(prevBlocks => [newBlock, ...prevBlocks.slice(0, 9)]);
                return newHeight;
            });
            setMempool(generateMempool());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#0A0B0F] py-20 px-4 text-white">
            <Navbar />
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-12">Blockchain Explorer</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Blocks Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-purple-400">Recent Blocks</h2>
                        <div className="max-h-[80vh] overflow-y-auto pr-4">
                            {blocks.map(block => (
                                <BlockCard key={block.height} block={block} />
                            ))}
                        </div>
                    </div>

                    {/* Mempool Section */}
                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-blue-400">Mempool</h2>
                        <div className="max-h-[80vh] overflow-y-auto pr-4">
                            {mempool.map(pool => (
                                <MempoolView key={pool.id} mempool={pool} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default BlocksPage;
