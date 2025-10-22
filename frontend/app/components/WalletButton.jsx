"use client";
import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { toast } from "sonner";
import "./Navbar.css";
import { useWallet } from "../context/WalletContext";

export default function WalletButton() {
  const { walletAddress, setWalletAddress, signOut } = useWallet();
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    checkWalletConnection();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          try {
            localStorage.setItem("walletAddress", accounts[0]);
          } catch {}
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
      try {
        localStorage.setItem("walletAddress", accounts[0]);
      } catch {}
      toast.success("Wallet account changed");
    } else {
      setWalletAddress(null);
      try {
        localStorage.removeItem("walletAddress");
      } catch {}
      toast.info("Wallet disconnected");
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not found! Please install MetaMask.");
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        try {
          localStorage.setItem("walletAddress", accounts[0]);
        } catch {}
        toast.success("Wallet connected successfully! 🎉");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const localSignOut = () => {
    setIsDropdownOpen(false);
    signOut();
    toast.info("Wallet disconnected");
  };

  return (
    <div
      className="wallet-button-container"
      ref={dropdownRef}
      style={{ position: "relative" }}
    >
      {walletAddress ? (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="wallet-address-btn"
          >
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </button>
          {isDropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                zIndex: 1000,
                transformOrigin: "top right",
              }}
              className="wallet-dropdown"
            >
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "8px",
                  borderRadius: "8px",
                  minWidth: 140,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#d1d5db",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  ></div>
                </div>
                <button
                  onClick={localSignOut}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "#7c3aed",
                    border: "none",
                    color: "#fff",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={loading}
          className="connect-wallet-btn"
        >
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}
