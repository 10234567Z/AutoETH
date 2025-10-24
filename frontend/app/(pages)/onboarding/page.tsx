"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import Sidebar from "@/app/components/Sidebar";

type AgentDetailsPayload = {
  name: string;
  readme: string;
  avatar_url: string;
  short_description: string;
  network?: string;
  agentverse_api_key: string;
  agent_seed?: string | null;
  wallet_address: string;
  deviation: number;
};

const AVATAR_OPTIONS = Array.from(
  { length: 10 },
  (_, i) => `https://api.dicebear.com/7.x/bottts/svg?seed=avatar-${i + 1}`
);

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "error";
console.log("Using contract address:", CONTRACT_ADDRESS);
const CONTRACT_ABI = [
  {
    inputs: [
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
        internalType: "struct ProofOfIntelligence.Agent",
        name: "agent",
        type: "tuple",
      },
    ],
    name: "registerAgent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const Onboarding = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [readme, setReadme] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [agentverseKey, setAgentverseKey] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showKeyHelp, setShowKeyHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviation] = useState(() => Math.floor(Math.random() * 90) + 10);

  // --- Wallet detection ---
  useEffect(() => {
    const detectWallet = async () => {
      const anyWindow: any = window;
      if (!anyWindow.ethereum) return;
      try {
        const accounts = await anyWindow.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts?.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
        }
      } catch (err) {
        console.error("Wallet detection error:", err);
      }
    };
    detectWallet();
  }, []);

  // --- Connect wallet manually ---
  const connectWallet = async () => {
    const anyWindow: any = window;
    if (!anyWindow.ethereum) {
      alert("No Ethereum wallet found. Please install MetaMask.");
      return;
    }
    try {
      const accounts = await anyWindow.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts?.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
      }
    } catch (err) {
      console.error("Wallet connect error:", err);
      setError("Failed to connect wallet");
    }
  };

  // --- Register agent handler ---
  const submitAgent = async () => {
    setError(null);

    if (!walletConnected || !walletAddress)
      return setError("Connect your wallet first");
    if (!name || !shortDescription || !agentverseKey)
      return setError("Please fill in all required fields");

    const payload: AgentDetailsPayload = {
      name,
      readme,
      avatar_url: "https://pbs.twimg.com/profile_images/1878738447067652096/tXQbWfpf.jpg",
      short_description: shortDescription,
      network: "testnet",
      agentverse_api_key: agentverseKey,
      agent_seed: null,
      wallet_address: walletAddress,
      deviation,
    };

    setLoading(true);

    try {
      // STEP 1: Register via backend API and get Agentverse address
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMsg = "Backend registration failed";
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.message || errorMsg;
        } catch {
          const textError = await response.text();
          errorMsg = textError || errorMsg;
        }
        console.error("Backend error:", errorMsg);
        throw new Error(errorMsg);
      }

      const responseData = await response.json();
      console.log("Backend response:", responseData);
      const agentverseAddress = responseData.agent_address;

      if (!agentverseAddress) {
        throw new Error("Failed to get Agentverse address from backend");
      }

      console.log("✅ Agent created on Agentverse:", agentverseAddress);

      // STEP 2: On-chain registration with Agentverse address
      try {
        const anyWindow: any = window;
        if (!anyWindow.ethereum)
          throw new Error("No wallet found for on-chain registration");

        // Handle both ethers v6 and v5
        let provider;
        const ethersAny: any = ethers;
        if (ethersAny.BrowserProvider) {
          // ethers v6
          provider = new ethersAny.BrowserProvider(anyWindow.ethereum);
        } else if (ethersAny.providers?.Web3Provider) {
          // ethers v5
          provider = new ethersAny.providers.Web3Provider(anyWindow.ethereum);
        } else {
          throw new Error("Unsupported ethers version");
        }

        // Check network first, switch if needed
        const network = await provider.getNetwork();
        const chainId =
          typeof network.chainId === "number"
            ? network.chainId
            : Number(network.chainId);
        
        if (chainId !== 84532) {
          console.log("Switching to Base Sepolia...");
          await anyWindow.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x14a34" }], // Base Sepolia (84532 in hex)
          });
          
          // Recreate provider after network switch
          if (ethersAny.BrowserProvider) {
            provider = new ethersAny.BrowserProvider(anyWindow.ethereum);
          } else if (ethersAny.providers?.Web3Provider) {
            provider = new ethersAny.providers.Web3Provider(anyWindow.ethereum);
          }
        }

        // Get accounts directly without using getSigner() to avoid ENS
        await provider.send("eth_requestAccounts", []);
        const accounts = await provider.send("eth_accounts", []);
        const signerAddress = accounts[0];

        if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          throw new Error("Connected wallet mismatch. Please reconnect.");
        }

        // Create signer without ENS resolution
        const signer = await provider.getSigner(signerAddress);

        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );

        // CRITICAL: Use Agentverse address, not human name
        const agentTuple = [
          agentverseAddress, // ✅ Use Agentverse address from backend
          walletAddress,
          0, // totalGuesses
          0, // bestGuesses
          0, // accuracy
          0, // lastGuessBlock
          deviation, // deviation (required by contract)
        ];
        
        console.log("📝 Registering on-chain with Agentverse address:", agentverseAddress);
        const tx = await contract.registerAgent(agentTuple);
        console.log("On-chain tx submitted:", tx.hash);
        await tx.wait();
        console.log(`Tx confirmed! https://base-sepolia.blockscout.com/tx/${tx.hash}`);
      } catch (chainErr: any) {
        console.error("On-chain registration error:", chainErr);
        setError(
          (prev) =>
            (prev ? prev + " | " : "") +
            (chainErr?.reason ||
              chainErr?.message ||
              "On-chain registration failed")
        );
      }

      // Navigate to dashboard on success
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Component UI ---
  return (
    <div className="min-h-screen bg-[#0A0B0F]">
      <Sidebar activePage="onboarding" />
      
      <main className="ml-16 min-h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
        {/* Background circles */}
        <div className="absolute inset-0 z-0 opacity-50">
          <div className="absolute w-96 h-96 bg-purple-900 rounded-full -top-20 -left-20 opacity-30 floating-shape" />
          <div
            className="absolute w-96 h-96 bg-blue-900 rounded-full -bottom-20 -right-20 opacity-30 floating-shape"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-24 z-10">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-start">
          {/* Left info */}
          <section className="text-center md:text-left">
            <h1 className="text-4xl font-bold mb-4">Create Your AI Agent</h1>
            <p className="text-gray-300 mb-6">
              Join a decentralized network of AI agents. Register your agent to
              compete, contribute, and build your reputation.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">Why Register?</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                {[
                  "Compete on the leaderboard",
                  "Earn rewards",
                  "Join a decentralized AI network",
                ].map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-green-400"
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
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-sm text-gray-400">
              Selected deviation:{" "}
              <span className="font-semibold text-white">{deviation}</span>
            </p>
          </section>

          {/* Right form */}
          <section className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Agent Registration
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agent Name *"
                className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-purple-500"
              />

              {/* Short description */}
              <input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Short Description *"
                className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-purple-500"
              />

              {/* Readme */}
              <textarea
                value={readme}
                onChange={(e) => setReadme(e.target.value)}
                rows={4}
                placeholder="Detailed approach / notes"
                className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-purple-500"
              />

              {/* API Key */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  AgentVerse API Key *
                </label>
                <input
                  value={agentverseKey}
                  onChange={(e) => setAgentverseKey(e.target.value)}
                  placeholder="sk_live_xxx or sk_test_xxx"
                  className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              {/* Wallet connection */}
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Wallet
                </label>
                {walletConnected ? (
                  <div className="w-full bg-green-500/10 border border-green-500 rounded-md px-4 py-3 text-green-300">
                    Connected:{" "}
                    <span className="font-mono">{walletAddress}</span>
                  </div>
                ) : (
                  <button
                    onClick={connectWallet}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md"
                  >
                    Connect MetaMask
                  </button>
                )}
              </div>

              {error && <div className="text-sm text-red-400">{error}</div>}

              <button
                disabled={
                  !walletConnected ||
                  !name ||
                  !shortDescription ||
                  !agentverseKey ||
                  loading
                }
                onClick={submitAgent}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-60"
              >
                {loading ? "Registering..." : "Register Agent"}
              </button>
            </div>
          </section>
        </div>
      </div>

        {/* Help Modal */}
        {showKeyHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#0b0c0f] border border-white/10 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-2">
              How to get an AgentVerse API Key
            </h3>
            <ol className="list-decimal list-inside text-sm text-gray-300 space-y-2 mb-4">
              <li>
                Visit{" "}
                <a
                  href="https://agentverse.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 underline"
                >
                  agentverse.ai
                </a>{" "}
                and log in.
              </li>
              <li>Go to the “API Keys” or “Developer” section.</li>
              <li>Click “Create New Key”.</li>
              <li>Copy your key and paste it here securely.</li>
            </ol>
            <div className="flex justify-end">
              <button
                onClick={() => setShowKeyHelp(false)}
                className="px-4 py-2 bg-white/5 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default Onboarding;
