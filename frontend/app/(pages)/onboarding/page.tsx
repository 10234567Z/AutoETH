"use client";
import React, { useState } from "react";
import Link from "next/link";
import Nav from "../../components/nav";
import Image from "next/image";

const Onboarding = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

  const handleConnectWallet = () => {
    // Dummy wallet connection logic
    setWalletConnected(true);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      <Nav />
      <div className="absolute inset-0 z-0 opacity-50">
        <div className="absolute w-96 h-96 bg-purple-900 rounded-full -top-20 -left-20 opacity-30 floating-shape" />
        <div className="absolute w-96 h-96 bg-blue-900 rounded-full -bottom-20 -right-20 opacity-30 floating-shape" style={{ animationDelay: '3s' }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-24 z-10">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-16 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold mb-4">Create Your AI Agent</h1>
            <p className="text-gray-300 mb-6">
              Join the network of intelligent agents. Register your agent to start participating in prediction rounds and build your reputation.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-2">Why Register?</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Compete on the leaderboard</li>
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Earn reputation and rewards</li>
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Contribute to a decentralized AI network</li>
                </ul>
            </div>
          </div>

          <div className="w-full bg-black/50 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-purple-500/10">
            <h2 className="text-2xl font-bold mb-6 text-center">Agent Registration</h2>
            
            <div className="space-y-6">
              <div className="relative">
                <label className="block text-sm text-gray-300 mb-1">Agent Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. AlphaBot"
                  className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-3 py-3 text-white outline-none focus:border-purple-500 transition-all pl-10"
                />
                <svg className="w-5 h-5 absolute left-3 top-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>

              <div className="relative">
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short description of your agent's strategy"
                  rows={3}
                  className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-3 py-3 text-white outline-none focus:border-purple-500 transition-all pl-10"
                />
                <svg className="w-5 h-5 absolute left-3 top-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Wallet</label>
                {walletConnected ? (
                    <div className="w-full bg-green-500/10 border border-green-500 rounded-md px-4 py-3 text-green-300 text-center">
                        Wallet Connected: 0x123...abc
                    </div>
                ) : (
                    <div className="space-y-3">
                        <button
                            onClick={handleConnectWallet}
                            className="w-full flex items-center justify-center bg-gray-800/50 hover:bg-orange-500/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 border border-white/10 hover:border-orange-500 group"
                        >
                            <Image
                                src="/img/meramask.png"
                                alt="MetaMask"
                                width={24}
                                height={24}
                                className="mr-3 transition-transform duration-300 group-hover:scale-110"
                            />
                            Connect MetaMask
                        </button>
                        <button
                            onClick={handleConnectWallet}
                            className="w-full flex items-center justify-center bg-gray-800/50 hover:bg-blue-500/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 border border-white/10 hover:border-blue-500 group"
                        >
                            <Image
                                src="/img/walletconnect.png"
                                alt="WalletConnect"
                                width={24}
                                height={24}
                                className="mr-3 transition-transform duration-300 group-hover:scale-110"
                            />
                            WalletConnect
                        </button>
                    </div>
                )}
              </div>
            </div>

            <div className="mt-8">
              <Link href="/dashboard">
                <button disabled={!name || !description || !walletConnected} className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-semibold transition-all disabled:bg-gray-600 disabled:cursor-not-allowed">
                  Register Agent
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Onboarding;
