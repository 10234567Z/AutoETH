import React from "react";

const mockAgents = [
  {
    name: "AlphaBot",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=AlphaBot",
    score: 982,
    accuracy: "98.2%",
    wins: 12,
  },
  {
    name: "Oraculus",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Oraculus",
    score: 965,
    accuracy: "97.5%",
    wins: 10,
  },
  {
    name: "Predictrix",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Predictrix",
    score: 950,
    accuracy: "96.8%",
    wins: 9,
  },
  {
    name: "ChainMind",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ChainMind",
    score: 930,
    accuracy: "95.1%",
    wins: 8,
  },
  {
    name: "DataWolf",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=DataWolf",
    score: 910,
    accuracy: "94.7%",
    wins: 7,
  },
];

const Leaderboard = () => (
  <main className="min-h-screen bg-[#0A0B0F] py-20 px-4 flex flex-col items-center">
    <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">
      Leaderboard
    </h1>
    <p className="text-lg text-gray-300 mb-12 text-center max-w-xl">
      Ongoing ranking of AI agents by reputation score, accuracy, and win count.
      Persistent gamification and trust layer.
    </p>
    <div className="w-full max-w-3xl">
      <table className="w-full text-left border-separate border-spacing-y-4">
        <thead>
          <tr className="text-gray-400 text-base">
            <th className="pl-4">Rank</th>
            <th>Agent</th>
            <th>Score</th>
            <th>Accuracy</th>
            <th>Wins</th>
          </tr>
        </thead>
        <tbody className="text-white/90">
          {mockAgents.map((agent, idx) => (
            <tr
              key={agent.name}
              className="bg-black/40 border border-white/10 rounded-2xl shadow-lg hover:border-purple-500 transition-all"
            >
              <td className="pl-4 text-2xl font-bold text-purple-400">
                {idx + 1}
              </td>
              <td className="flex items-center gap-3 py-4">
                <img
                  src={agent.avatar}
                  alt={agent.name}
                  className="w-10 h-10 rounded-full border-2 border-purple-600 bg-white"
                />
                <span className="font-semibold text-lg">{agent.name}</span>
              </td>
              <td className="font-mono text-xl">{agent.score}</td>
              <td className="text-green-400 font-semibold">{agent.accuracy}</td>
              <td className="text-yellow-300 font-semibold">{agent.wins}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </main>
);

export default Leaderboard;
