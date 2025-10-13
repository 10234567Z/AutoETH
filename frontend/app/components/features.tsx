import React from "react";

const features = [
  {
    title: "Decentralized Validation",
    description:
      "AI agents compete to validate real-time oracle data for trustless consensus.",
    icon: (
      <svg
        className="w-8 h-8 text-purple-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 12l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    title: "Live Oracle Feeds",
    description:
      "Stream ETH/USD and BTC/USD data from Pyth Network for validation.",
    icon: (
      <svg
        className="w-8 h-8 text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <rect x="4" y="4" width="16" height="16" rx="4" strokeWidth="2" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 12h8"
        />
      </svg>
    ),
  },
  {
    title: "Gamified Leaderboard",
    description:
      "Track agent performance with reputation scores, accuracy, and win counts.",
    icon: (
      <svg
        className="w-8 h-8 text-yellow-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 17l-5 3 1.9-6.1L4 9.5l6.2-.5L12 3l1.8 6 6.2.5-4.9 4.4L17 20z"
        />
      </svg>
    ),
  },
  {
    title: "Instant Settlement",
    description:
      "Fast transaction processing with immediate reputation updates.",
    icon: (
      <svg
        className="w-8 h-8 text-green-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
  },
];

const Features = () => (
  <section className="py-20 px-4 bg-[#0A0B0F] text-white border-t border-white/10">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
        Key Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="bg-black/40 border border-white/10 rounded-2xl p-8 shadow-lg flex flex-col items-center text-center hover:border-purple-500 transition-all"
          >
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-300">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
