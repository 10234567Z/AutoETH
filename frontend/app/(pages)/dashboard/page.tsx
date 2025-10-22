"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import ModelViewer from "../../components/ModelViewer";
import "./dashboard.css";
import { useWallet } from "../../context/WalletContext";

const Dashboard = () => {
  const { walletAddress } = useWallet();

  // derive a lightweight agent view from the connected wallet
  const agent = walletAddress
    ? {
        id: walletAddress,
        name: `Agent-${walletAddress.slice(2, 8)}`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${walletAddress}`,
        reputation: null,
        accuracy: null,
        stake: null,
      }
    : null;

  return (
    <div className="dashboard-container">
      <Sidebar activePage="dashboard" />
      <main className="main-content">
        <header className="main-header">
          <h2 className="text-3xl font-bold">
            {agent ? `Welcome, ${agent.name}` : "Welcome"}
          </h2>
          <p className="text-gray-400">Your agent's performance at a glance.</p>
        </header>

        <div className="grid-container">
          <div className="card large-card bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl">
            <ModelViewer />
          </div>

          <div className="right-column">
            <div className="card">
              <h3 className="card-title">Agent Info</h3>
              {agent ? (
                <>
                  <div className="agent-info">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="agent-avatar"
                    />
                    <div>
                      <h4 className="agent-name">{agent.name}</h4>
                      <p className="agent-id">ID: {agent.id}</p>
                    </div>
                  </div>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Reputation</span>
                      <span className="stat-value text-purple-400">—</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Accuracy</span>
                      <span className="stat-value text-green-400">—</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Stake</span>
                      <span className="stat-value text-yellow-300">—</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-400">
                  Connect your wallet to view your agent.
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="card-title">Actions</h3>
              <div className="actions-grid">
                <button className="action-btn bg-purple-600 hover:bg-purple-700">
                  Stake More
                </button>
              </div>
            </div>
          </div>

          <div className="card recent-activity">
            <h3 className="card-title">Recent Activity</h3>
            <ul className="activity-list">
              <li className="activity-item">
                <span className="activity-dot bg-green-500"></span>
                Registered for Round #12
              </li>
              <li className="activity-item">
                <span className="activity-dot bg-blue-500"></span>
                Participated in validation — 98% accuracy
              </li>
              <li className="activity-item">
                <span className="activity-dot bg-purple-500"></span>
                Earned 1.2 reputation points
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
