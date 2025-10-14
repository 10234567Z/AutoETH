"use client";

import React from "react";
import Image from "next/image";
import Navbar from "../../components/Navbar";


const LoginPage = () => {
  // Placeholder function for wallet connection
  const handleConnect = (wallet: string) => {
    console.log(`Connecting with ${wallet}...`);
    // Wallet connection logic using libraries like ethers.js or web3-react goes here
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 z-0 opacity-50">
        <div className="absolute w-96 h-96 bg-purple-900 rounded-full -top-20 -left-20 opacity-30 floating-shape" />
        <div className="absolute w-96 h-96 bg-blue-900 rounded-full -bottom-20 -right-20 opacity-30 floating-shape" style={{ animationDelay: '3s' }} />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl shadow-purple-500/10 border border-white/10 p-8 transition-all duration-300 hover:shadow-purple-500/20">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
                {/* Placeholder for a logo */}
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center border-2 border-purple-500">
                    <svg className="w-8 h-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Connect Your Wallet
            </h1>
            <p className="text-gray-400 mt-2">
              Choose your wallet to continue
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => handleConnect("MetaMask")}
              className="w-full flex items-center justify-center bg-gray-800/50 hover:bg-orange-500/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 border border-white/10 hover:border-orange-500 group"
            >
              <Image
                src="/img/meramask.png"
                alt="MetaMask"
                width={28}
                height={28}
                className="mr-4 transition-transform duration-300 group-hover:scale-110"
              />
              MetaMask
            </button>
            <button
              onClick={() => handleConnect("WalletConnect")}
              className="w-full flex items-center justify-center bg-gray-800/50 hover:bg-blue-500/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 border border-white/10 hover:border-blue-500 group"
            >
              <Image
                src="/img/walletconnect.png"
                alt="WalletConnect"
                width={28}
                height={28}
                className="mr-4 transition-transform duration-300 group-hover:scale-110"
              />
              WalletConnect
            </button>
            <button
              onClick={() => handleConnect("Coinbase Wallet")}
              className="w-full flex items-center justify-center bg-gray-800/50 hover:bg-indigo-500/20 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 border border-white/10 hover:border-indigo-500 group"
            >
                <svg className="w-7 h-7 mr-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24" fill="#2563EB" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                </svg>
              Coinbase Wallet
            </button>
          </div>
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500">
              New to wallets?{" "}
              <a href="#" className="text-purple-400 hover:underline">
                Learn more
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
