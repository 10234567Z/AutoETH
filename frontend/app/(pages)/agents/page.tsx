'use client'
import React, { useState } from "react";
import Navbar from "../../components/Navbars";

const initialAgents = [
  {
    id: 1,
    name: "AlphaBot",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=AlphaBot",
    description: "A pioneering agent specializing in high-frequency market predictions.",
    reputation: 982,
    accuracy: "98.2%",
    wins: 12,
  },
  {
    id: 2,
    name: "Oraculus",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Oraculus",
    description: "An oracle agent with a focus on long-term trend analysis.",
    reputation: 965,
    accuracy: "97.5%",
    wins: 10,
  },
  {
    id: 3,
    name: "Predictrix",
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Predictrix",
    description: "Specializes in predicting volatility and market swings.",
    reputation: 950,
    accuracy: "96.8%",
    wins: 9,
  },
];

const AgentCard = ({ agent, onDelete }) => (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex flex-col justify-between">
        <div>
            <div className="flex items-center gap-4 mb-4">
                <img src={agent.avatar} alt={agent.name} className="w-16 h-16 rounded-full border-2 border-purple-500"/>
                <div>
                    <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                    <p className="text-sm text-gray-400">{agent.description}</p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-sm mb-4">
                <div>
                    <div className="font-bold text-purple-400">Reputation</div>
                    <div className="text-white">{agent.reputation}</div>
                </div>
                <div>
                    <div className="font-bold text-green-400">Accuracy</div>
                    <div className="text-white">{agent.accuracy}</div>
                </div>
                <div>
                    <div className="font-bold text-yellow-400">Wins</div>
                    <div className="text-white">{agent.wins}</div>
                </div>
            </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
            <button className="text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-1 rounded-md transition-all">Edit</button>
            <button onClick={() => onDelete(agent.id)} className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-300 px-3 py-1 rounded-md transition-all">Delete</button>
        </div>
    </div>
);

const AddAgentModal = ({ onAdd, onClose }) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleAdd = () => {
        if (!name || !description) return;
        const newAgent = {
            id: Date.now(),
            name,
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
            description,
            reputation: Math.floor(Math.random() * 100) + 800,
            accuracy: `${(Math.random() * 10 + 85).toFixed(1)}%`,
            wins: Math.floor(Math.random() * 5),
        };
        onAdd(newAgent);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6">Add New Agent</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="Agent Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-purple-500" />
                    <textarea placeholder="Agent Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#0b0c0f] border border-white/10 rounded-md px-4 py-3 text-white outline-none focus:border-purple-500" rows={3}></textarea>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-md transition-all">Cancel</button>
                    <button onClick={handleAdd} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md font-semibold transition-all">Add Agent</button>
                </div>
            </div>
        </div>
    );
};

const AgentsPage = () => {
    const [agents, setAgents] = useState(initialAgents);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddAgent = (newAgent) => {
        setAgents(prev => [newAgent, ...prev]);
    };

    const handleDeleteAgent = (id) => {
        if (window.confirm("Are you sure you want to delete this agent?")) {
            setAgents(prev => prev.filter(agent => agent.id !== id));
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#0A0B0F] py-20 px-4 text-white">
            <Navbar />
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <h1 className="text-4xl font-bold">Manage Agents</h1>
                    <button onClick={() => setIsModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-semibold transition-all flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Add New Agent
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {agents.map(agent => (
                        <AgentCard key={agent.id} agent={agent} onDelete={handleDeleteAgent} />
                    ))}
                </div>
            </div>

            {isModalOpen && <AddAgentModal onAdd={handleAddAgent} onClose={() => setIsModalOpen(false)} />}
        </main>
    );
};

export default AgentsPage;
