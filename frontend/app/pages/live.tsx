import React, { useEffect, useState } from "react";

const feeds = [
  {
    symbol: "ETH/USD",
    color: "bg-purple-600",
    icon: (
      <svg
        className="w-8 h-8 text-purple-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v8m0 0l-4-4m4 4l4-4"
        />
      </svg>
    ),
  },
  {
    symbol: "BTC/USD",
    color: "bg-yellow-400",
    icon: (
      <svg
        className="w-8 h-8 text-yellow-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v8m0 0l-4-4m4 4l4-4"
        />
      </svg>
    ),
  },
];

// Simulate live price updates
function useLivePrices() {
  const [prices, setPrices] = useState({ ETH: 3400.12, BTC: 62000.45 });
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => ({
        ETH: +(prev.ETH + (Math.random() - 0.5) * 10).toFixed(2),
        BTC: +(prev.BTC + (Math.random() - 0.5) * 50).toFixed(2),
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, []);
  return prices;
}

const LiveFeed = () => {
  const prices = useLivePrices();
  return (
    <main className="min-h-screen bg-[#0A0B0F] py-20 px-4 flex flex-col items-center">
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 text-center">
        Live Oracle Feed
      </h1>
      <p className="text-lg text-gray-300 mb-12 text-center max-w-xl">
        Real-time price updates streamed from Pyth Network. External data
        integration for trustless validation.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-3xl">
        {feeds.map((feed, idx) => (
          <div
            key={feed.symbol}
            className={`relative rounded-2xl p-8 shadow-xl border border-white/10 bg-black/40 flex flex-col items-center justify-center transition-all duration-300 hover:border-purple-500 animate-fade-in ${feed.color}`}
            style={{ animationDelay: `${idx * 0.2}s` }}
          >
            <div className="absolute top-4 right-4 opacity-30 blur-xl w-16 h-16 rounded-full bg-white/10" />
            <div className="mb-4">{feed.icon}</div>
            <h2 className="text-2xl font-bold mb-2 text-white">
              {feed.symbol}
            </h2>
            <div className="text-4xl font-mono font-bold mb-2 text-white">
              {feed.symbol === "ETH/USD" ? `$${prices.ETH}` : `$${prices.BTC}`}
            </div>
            <span className="text-sm text-gray-400">Updated live</span>
          </div>
        ))}
      </div>
    </main>
  );
};

export default LiveFeed;
