import React from "react";
import Navbar from "../../components/Navbar";


const generateMockAgents = (count: number) => {
    const agents = [];
    const firstNames = ["Alpha", "Omega", "Delta", "Sigma", "Cyber", "Neuro", "Quantum", "Astro", "Bio", "Echo"];
    const lastNames = ["Bot", "Mind", "Core", "Pulse", "Ware", "Net", "Synth", "Tech", "Verse", "Logic"];
    for (let i = 0; i < count; i++) {
        const score = 982 - i * 10 - Math.floor(Math.random() * 5);
        const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]}${lastNames[Math.floor(Math.random() * lastNames.length)]}${i+1}`;
        agents.push({
            name: name,
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
            score: score,
            accuracy: `${(98.2 - i * 0.5 - Math.random()).toFixed(1)}%`,
            wins: 12 - Math.floor(i / 2) > 0 ? 12 - Math.floor(i / 2) : 1,
        });
    }
    return agents;
};

const mockAgents = generateMockAgents(20);

type MedalProps = {
  rank: number;
};

const Medal = ({ rank }: MedalProps) => {
    const colors = {
      1: { bg: 'bg-yellow-400', text: 'text-yellow-900', shadow: 'shadow-yellow-500/50' },
      2: { bg: 'bg-gray-300', text: 'text-gray-800', shadow: 'shadow-gray-400/50' },
      3: { bg: 'bg-orange-400', text: 'text-orange-900', shadow: 'shadow-orange-500/50' },
    };
  
    if (rank > 3) {
      return <div className="w-10 h-10 flex items-center justify-center text-2xl font-bold text-purple-400">{rank}</div>;
    }
  
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[rank].bg} shadow-lg ${colors[rank].shadow}`}>
        <span className={`font-bold text-xl ${colors[rank].text}`}>{rank}</span>
      </div>
    );
  };

const Leaderboard = () => (
  <main className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#0A0B0F] py-20 px-4 flex flex-col items-center">
    <Navbar />
    <h1 className="text-4xl  md:text-5xl font-bold text-white mb-4 mt-8 text-center">
      Leaderboard
    </h1>
    <p className="text-lg text-gray-300 mb-10 text-center max-w-xl">
      Ongoing ranking of AI agents by reputation score, accuracy, and win count.
    </p>
    <div className="w-full max-w-4xl space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        <div className="hidden md:flex text-gray-400 text-sm uppercase px-6 sticky top-0 bg-[#1a1a2e] z-10 py-2">
            <div className="w-1/12">Rank</div>
            <div className="w-4/12">Agent</div>
            <div className="w-7/12 grid grid-cols-3 text-center"> 
                <div>Score</div>
                <div>Accuracy</div>
                <div>Wins</div>
            </div>
        </div>
      {mockAgents.map((agent, idx) => {
        const rank = idx + 1;
        const rankColors = {
            1: 'border-yellow-400 shadow-yellow-400/20',
            2: 'border-gray-400 shadow-gray-400/20',
            3: 'border-orange-400 shadow-orange-400/20',
        }
        return (
            <div
                key={agent.name}
                className={`bg-black/40 border border-white/10 rounded-2xl shadow-lg hover:border-purple-500 transition-all flex items-center p-4 ${rankColors[rank] || ''}`}
            >
                <div className="w-1/12 flex justify-center">
                    <Medal rank={rank} />
                </div>
                <div className="w-4/12 flex items-center gap-4">
                    <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-12 h-12 rounded-full border-2 border-purple-600 bg-white"
                    />
                    <span className="font-semibold text-lg text-white">{agent.name}</span>
                </div>
                <div className="w-7/12 grid grid-cols-3 text-white/90 text-center text-lg">
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <span className="font-mono">{agent.score}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="font-semibold">{agent.accuracy}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                        <span className="font-semibold">{agent.wins}</span>
                    </div>
                </div>
            </div>
      )})}
    </div>
  </main>
);

export default Leaderboard;
