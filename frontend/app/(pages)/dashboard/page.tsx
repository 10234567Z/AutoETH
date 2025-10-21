"use client";
import React from "react";
import Nav from "../../components/nav";
import Link from "next/link";
import Navbar from "../../components/Navbars";
import ModelViewer from "../../components/ModelViewer"; // Adjust path as needed

const Dashboard = () => {
  // placeholder data
  const agent = {
    id: "AGENT-1234",
    name: "AlphaBot",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=AlphaBot",
    reputation: 982,
    accuracy: "98.2%",
    stake: "12.5 HBAR",
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col overflow-hidden">

      <div className="absolute inset-0 z-0 opacity-50">
        <div className="absolute w-96 h-96 bg-purple-900 rounded-full -top-20 -left-20 opacity-30 floating-shape" />
        <div
          className="absolute w-96 h-96 bg-blue-900 rounded-full -bottom-20 -right-20 opacity-30 floating-shape"
          style={{ animationDelay: "3s" }}
        />
      </div>{" "}
      <ModelViewer />
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-20 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome, {agent.name}</h1>
            <p className="text-gray-400">
              Here is your agent's performance overview.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-black/40 border border-white/10 rounded-2xl shadow-lg p-6">
                <div className="sketchfab-embed-wrapper rounded-lg overflow-hidden">
                  <div
                    style={{
                      position: "relative",
                      paddingBottom: "56.25%",
                      height: 0,
                    }}
                  >
                    {" "}
                    <ModelViewer />
                    <iframe
                      title="Bitcoin Factory - Voxel art"
                      frameBorder="0"
                      allow="autoplay; fullscreen; xr-spatial-tracking"
                      src="https://sketchfab.com/models/d6b36d8c19e841bfb0b6a6e5e033a172/embed?autostart=1&ui_infos=0&ui_controls=0&ui_annotations=0&ui_general_controls=0&ui_watermark=0&ui_hint=0"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                      }}
                    ></iframe>
                  </div>
                </div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold mb-4 text-lg">Recent Activity</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Registered for Round #12
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Participated in validation — 98% accuracy
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Earned 1.2 reputation points
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-16 h-16 rounded-full border-2 border-purple-500"
                  />
                  <div>
                    <h2 className="text-2xl font-bold">{agent.name}</h2>
                    <p className="text-sm text-gray-400">ID: {agent.id}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg">
                    <span className="text-gray-400">Reputation</span>
                    <span className="font-bold text-purple-400 text-lg">
                      {agent.reputation}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg">
                    <span className="text-gray-400">Accuracy</span>
                    <span className="font-bold text-green-400 text-lg">
                      {agent.accuracy}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg">
                    <span className="text-gray-400">Stake</span>
                    <span className="font-bold text-yellow-300 text-lg">
                      {agent.stake}
                    </span>
                  </div>
                </div>
              </div>
              <ModelViewer />

              <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-lg">
                <h4 className="font-semibold mb-4 text-lg">Actions</h4>
                <div className="flex flex-col gap-3">
                  <button className="w-full text-left flex items-center gap-3 bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg font-semibold transition-all">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Stake More
                  </button>
                  <button className="w-full text-left flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-3 rounded-lg transition-all">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    View Predictions
                  </button>
                  <Link href="/live" className="w-full">
                    <button className="w-full text-left flex items-center gap-3 bg-black border border-white/10 hover:bg-white/5 px-4 py-3 rounded-lg transition-all">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Live Feed
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
