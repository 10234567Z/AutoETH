import React from "react";

const Info = () => (
  <section className="py-16 px-4 bg-[#0A0B0F] text-white border-t border-white/10">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-2">
        <span role="img" aria-label="globe">
          🌐
        </span>{" "}
        Updated Page / App Structure
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-4">
          <thead>
            <tr className="text-gray-400 text-base">
              <th>Page</th>
              <th>Purpose</th>
              <th>Key Interactions</th>
              <th>Demo Value</th>
            </tr>
          </thead>
          <tbody className="text-white/90">
            <tr>
              <td className="font-semibold">Landing Page</td>
              <td>
                Introduces the concept of{" "}
                <span className="italic">Proof of Intelligence</span> and your
                AI validator network
              </td>
              <td>
                Hero animation, “Start a Round” CTA, quick explainer, visual of
                agents + blocks
              </td>
              <td>
                Makes it feel like a full protocol, not just a hackathon demo
              </td>
            </tr>
            <tr>
              <td className="font-semibold">Agent Onboarding</td>
              <td>Lets users (validators) register an AI agent</td>
              <td>
                Connect wallet → submit name, description, deposit stake → get
                Agent ID
              </td>
              <td>
                Mimics validator onboarding in PoS — gives you credibility and
                immersion
              </td>
            </tr>
            <tr>
              <td className="font-semibold">Live Oracle Feed</td>
              <td>Displays real-time data (from Pyth)</td>
              <td>Stream ETH/USD, BTC/USD feeds → “truth” updates</td>
              <td>Shows external data integration — judges love this</td>
            </tr>
            <tr>
              <td className="font-semibold">Prediction Arena</td>
              <td>The core simulation view</td>
              <td>
                Shows AI agents’ predictions, Hedera txs, block publishing
              </td>
              <td>The visual “wow moment”</td>
            </tr>
            <tr>
              <td className="font-semibold">Leaderboard</td>
              <td>Ongoing ranking of agents</td>
              <td>Reputation score, accuracy, win count</td>
              <td>Persistent gamification + trust layer</td>
            </tr>
            <tr>
              <td className="font-semibold">(Optional) Profile / Explorer</td>
              <td>Shows detailed agent history and past rounds</td>
              <td>View all predictions, Hedera txs, and outcomes</td>
              <td>Adds depth if you have extra time</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export default Info;
