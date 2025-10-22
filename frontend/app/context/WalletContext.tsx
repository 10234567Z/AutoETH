"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type WalletContextType = {
  walletAddress: string | null;
  setWalletAddress: (a: string | null) => void;
  signOut: () => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("walletAddress");
      if (stored) setWalletAddress(stored);
    } catch {}

    if ((window as any).ethereum) {
      (window as any).ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts && accounts.length) {
          setWalletAddress(accounts[0]);
          try {
            localStorage.setItem("walletAddress", accounts[0]);
          } catch {}
        } else {
          setWalletAddress(null);
          try {
            localStorage.removeItem("walletAddress");
          } catch {}
        }
      });
    }
  }, []);

  const signOut = () => {
    setWalletAddress(null);
    try {
      localStorage.removeItem("walletAddress");
    } catch {}
  };

  return (
    <WalletContext.Provider
      value={{ walletAddress, setWalletAddress, signOut }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
};
