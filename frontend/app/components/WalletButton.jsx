'use client';
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import "./Navbar.css";

export default function WalletButton() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWalletConnection();
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      toast.success('Wallet account changed');
    } else {
      setAccount(null);
      toast.info('Wallet disconnected');
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask not found! Please install MetaMask.');
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        toast.success('Wallet connected successfully! 🎉');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wallet-button-container">
        {account ? (
            <button className="wallet-address-btn">
                {account.slice(0, 6)}...{account.slice(-4)}
            </button>
        ) : (
            <button onClick={connectWallet} disabled={loading} className="connect-wallet-btn">
                {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
        )}
    </div>
  );
}
