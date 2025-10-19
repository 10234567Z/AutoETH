"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

const AVATAR_OPTIONS = Array.from({ length: 10 }).map(
  (_, i) => `/img/avatars/avatar-${i + 1}.png`
);

const Onboarding = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [readme, setReadme] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [agentverseKey, setAgentverseKey] = useState("");
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [showKeyHelp, setShowKeyHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // assign deviation randomly between 10 and 99 when user starts
  const [deviation] = useState(
    () => Math.floor(Math.random() * (99 - 10 + 1)) + 10
  );

  useEffect(() => {
    // Check for injected wallet (MetaMask)
    const checkWallet = async () => {
      const anyWindow: any = window;
      if (anyWindow.ethereum) {
        try {
          const accounts = await anyWindow.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts && accounts.length > 0) {
            setWalletConnected(true);
            setWalletAddress(accounts[0]);
          }
        } catch (e) {
          console.error("Error checking wallet:", e);
        }
      }
    };
    checkWallet();
  }, []);

  const connectWallet = async () => {
    const anyWindow: any = window;
    if (!anyWindow.ethereum) {
      alert(
        "No Ethereum provider found. Please install MetaMask or use WalletConnect."
      );
      return;
    }
    try {
      const accounts = await anyWindow.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setWalletConnected(true);
        setWalletAddress(accounts[0]);
      }
    } catch (e) {
      console.error("Wallet connect error:", e);
      setError("Failed to connect wallet");
    }
  };

  const submitAgent = async () => {
    setError(null);
    if (!walletConnected || !walletAddress) {
      setError("Connect your wallet first");
      return;
    }
    if (!name || !shortDescription || !agentverseKey) {
      setError("Please fill required fields");
      return;
    }

    const payload: AgentDetailsPayload = {
      name,
      readme,
      avatar_url: avatar,
      short_description: shortDescription,
      network: "testnet",
      agentverse_api_key: agentverseKey,
      agent_seed: null,
      wallet_address: walletAddress,
      deviation,
    };

    setLoading(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to register agent");
      }

      // success -> navigate to dashboard
      router.push("/dashboard");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-50">
        <div className="absolute w-96 h-96 bg-purple-900 rounded-full -top-20 -left-20 opacity-30 floating-shape" />
        <div
          className="absolute w-96 h-96 bg-blue-900 rounded-full -bottom-20 -right-20 opacity-30 floating-shape"
          style={{ animationDelay: "3s" }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-24 z-10">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-start">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold mb-4">Create Your AI Agent</h1>
            <p className="text-gray-300 mb-6">
              Join the network of intelligent agents. Register your agent to
              start participating in prediction rounds and build your
              reputation.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="font-bold text-lg mb-2">Why Register?</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2">
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
                  </svg>{" "}
                  Compete on the leaderboard
                </li>
                <li className="flex items-center gap-2">
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
                  </svg>{" "}
                  Earn reputation and rewards
                </li>
                <li className="flex items-center gap-2">
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
                  </svg>{" "}
                  Contribute to a decentralized AI network
                </li>
              </ul>
            </div>
            <div className="mt-6 text-sm text-gray-400">
              <div>
                Selected deviation:{" "}
                <span className="font-semibold text-white">{deviation}</span>
              </div>
            </div>
          </div>

          <div className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Agent Registration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Agent Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="AlphaBot"
                  className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Short Description *
                </label>
                <input
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="One-line strategy summary"
                  className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Readme / Details
                </label>
                <textarea
                  value={readme}
                  onChange={(e) => setReadme(e.target.value)}
                  rows={4}
                  placeholder="Longer description, approach and notes"
                  className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                  AgentVerse API Key{" "}
                  <button
                    onClick={() => setShowKeyHelp(true)}
                    title="How to get AgentVerse API key"
                    className="text-gray-400 hover:text-white"
                  >
                    {" "}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zM9 9a1 1 0 112 0v3a1 1 0 11-2 0V9zm1-4a1.25 1.25 0 100 2.5A1.25 1.25 0 0010 5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </label>
                <input
                  value={agentverseKey}
                  onChange={(e) => setAgentverseKey(e.target.value)}
                  placeholder="sk_live_xxx or sk_test_xxx"
                  className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Choose Avatar
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVATAR_OPTIONS.map((src) => (
                    <button
                      key={src}
                      onClick={() => setAvatar(src)}
                      className={`p-1 rounded-md border ${
                        avatar === src ? "border-purple-400" : "border-white/10"
                      } bg-[#0b0c0f]`}
                    >
                      <Image
                        src={src}
                        alt={src}
                        width={64}
                        height={64}
                        className="rounded-md"
                      />
                    </button>
                  ))}
                </div>
              </div>

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
                  <div className="space-y-2">
                    <button
                      onClick={connectWallet}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md"
                    >
                      Connect MetaMask
                    </button>
                  </div>
                )}
              </div>

              {error && <div className="text-sm text-red-400">{error}</div>}

              <div className="pt-2">
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
            </div>
          </div>
        </div>
      </div>

      {/* AgentVerse API Key Help Modal */}
      {showKeyHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#0b0c0f] border border-white/10 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-2">
              How to get an AgentVerse API Key
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Visit{" "}
              <a
                className="text-purple-400 underline"
                href="https://agentverse.ai"
                target="_blank"
                rel="noreferrer"
              >
                agentverse.ai
              </a>{" "}
              and sign up. From the dashboard, create a new API key and copy the
              secret here. Keep it private.
            </p>
            <div className="flex justify-end gap-2">
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
  );
};

export default Onboarding;
