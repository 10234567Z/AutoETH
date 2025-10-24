"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Home, Bot, Box, Globe, Menu, X } from "lucide-react";
import "./Sidebar.css";

import { useRouter } from "next/navigation";
import { useWallet } from "../context/WalletContext";

type SidebarProps = {
  activePage: string;
};

const Sidebar = ({ activePage }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { walletAddress, signOut } = useWallet();

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  return (
    <div
      className={`sidebar-container ${isOpen ? "open" : ""}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="sidebar-header">
        <div className="logo-container">
          <Bot size={40} className="logo-icon" />
          <h1 className={`logo-text ${isOpen ? "visible" : ""}`}>Agent UI</h1>
        </div>
        <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <nav className="sidebar-nav">
        {walletAddress && (
          <div
            style={{
              padding: "8px 0",
              color: "#d1d5db",
              fontSize: 13,
              textAlign: "center",
              wordBreak: "break-all",
              marginBottom: 8,
              background: isOpen ? "rgba(60,60,60,0.18)" : "transparent",
              borderRadius: 6,
            }}
          >
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </div>
        )}
        <Link
          href="/dashboard"
          className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
        >
          <Home size={24} className="nav-icon" />
          <span className={`nav-text ${isOpen ? "visible" : ""}`}>Home</span>
        </Link>
        <Link
          href="/blocks"
          className={`nav-item ${activePage === "blocks" ? "active" : ""}`}
        >
          <Box size={24} className="nav-icon" />
          <span className={`nav-text ${isOpen ? "visible" : ""}`}>Blocks</span>
        </Link>
        <Link
          href="/live"
          className={`nav-item ${activePage === "live" ? "active" : ""}`}
        >
          <Globe size={24} className="nav-icon" />
          <span className={`nav-text ${isOpen ? "visible" : ""}`}>
            Live Feed
          </span>
        </Link>
        <Link
          href="/leaderboard"
          className={`nav-item ${activePage === "leaderboard" ? "active" : ""}`}
        >
          <Box size={24} className="nav-icon" />
          <span className={`nav-text ${isOpen ? "visible" : ""}`}>
            Leaderboard
          </span>
        </Link>
        <button
          className={`nav-item wallet-signout-btn${isOpen ? " visible" : ""}`}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            color: "#ef4444",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            padding: "8px 0",
            marginTop: 0,
            paddingLeft:"18px",
            justifyContent: "flex-start",
          }}
          onClick={handleSignOut}
        >
          <X size={24} className="nav-icon" />
          <span className={`nav-text ${isOpen ? "visible" : ""}`}>
            Sign Out
          </span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
