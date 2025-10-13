"use client";

import React from "react";
import Image from "next/image";

const LoginPage = () => {
  // Placeholder function for wallet connection
  const handleConnect = (wallet: string) => {
    console.log(`Connecting with ${wallet}...`);
    // Wallet connection logic using libraries like ethers.js or web3-react goes here
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        {/* Using a gradient background similar to the hero section */}
        <div className="absolute inset-0 bg-black/70 bg-[radial-gradient(circle_at_50%_30%,rgba(109,40,217,0.15),transparent_70%)]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              Connect Your Wallet
            </h1>
            <p className="text-gray-400 mt-2">
              Choose your wallet to continue to the platform
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => handleConnect("MetaMask")}
              className="w-full flex items-center justify-center bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 border border-transparent hover:border-purple-500"
            >
              {/* Make sure to have metamask.svg in your /public folder */}
              <Image
                src="./public/img/metamask.svg"
                alt="MetaMask"
                width={28}
                height={28}
                className="mr-4"
              />
              MetaMask
            </button>
            <button
              onClick={() => handleConnect("WalletConnect")}
              className="w-full flex items-center justify-center bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 border border-transparent hover:border-blue-500"
            >
              {/* Make sure to have walletconnect.svg in your /public folder */}
              <Image
                src="/public/img/walletconnect.svg"
                alt="WalletConnect"
                width={28}
                height={28}
                className="mr-4"
              />
              WalletConnect
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
