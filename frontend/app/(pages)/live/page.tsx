"use client";
import Header from "@/app/components/Header";
import { WalletProvider } from "@/app/context/WalletContext";
import Sidebar from "@/app/components/Sidebar";
import { useLiveRound, LivePrediction, RoundData } from "@/app/hooks/useLiveRound";

import React, { useEffect, useState } from "react";

const HERMES_URL = "https://hermes.pyth.network";

const PRICE_IDS = [
  "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // ETH/USD
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", // BTC/USD
];

const PYTH_SYMBOLS: Record<string, string> = {
  "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace":
    "ETH/USD",
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43":
    "BTC/USD",
};

interface FeedCardProps {
  symbol: string;
  color: string;
  icon: React.ReactNode;
  price: number;
  updated: string;
  prediction?: string;
  change?: string;
}

function usePythFeed() {
  const [data, setData] = useState({
    ETH: { price: 0, updated: "-", change: "0%" },
    BTC: { price: 0, updated: "-", change: "0%" },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      const response = await fetch(
        `${HERMES_URL}/api/latest_price_feeds?ids[]=${PRICE_IDS[0]}&ids[]=${PRICE_IDS[1]}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("[PythFeed] Real API response:", result);

      if (!Array.isArray(result) || result.length === 0) {
        console.warn("[PythFeed] Invalid response format");
        return;
      }

      setData((prevData) => {
        const newPrices = {
          ETH: { ...prevData.ETH },
          BTC: { ...prevData.BTC },
        };

        for (let i = 0; i < result.length; i++) {
          const feed = result[i];
          console.log("[PythFeed] Processing feed:", feed);
          console.log("[PythFeed] Feed ID:", feed.id);
          console.log("[PythFeed] Feed price object:", feed.price);

          // Parse the price data from the API response
          const priceData = feed.price;
          if (!priceData) {
            console.warn("[PythFeed] No price data found in feed");
            continue;
          }

          const basePrice = Number(priceData.price);
          const expo = Number(priceData.expo);
          const calculatedPrice = basePrice * Math.pow(10, expo);

          console.log("[PythFeed] Price calculation:", {
            basePrice,
            expo,
            calculatedPrice,
          });

          if (isNaN(calculatedPrice) || calculatedPrice <= 0) {
            console.error(
              "[PythFeed] Invalid price calculation:",
              calculatedPrice
            );
            continue;
          }

          // Determine symbol based on price range
          // ETH is typically $1,000-$10,000
          // BTC is typically $20,000-$100,000
          let symbol: string;
          let currency: "ETH" | "BTC";

          if (calculatedPrice >= 10000) {
            // Higher price = BTC
            symbol = "BTC/USD";
            currency = "BTC";
          } else {
            // Lower price = ETH
            symbol = "ETH/USD";
            currency = "ETH";
          }

          console.log(
            "[PythFeed] Determined currency:",
            currency,
            "for price:",
            calculatedPrice
          );

          const updated = priceData.publish_time
            ? new Date(priceData.publish_time * 1000).toLocaleTimeString()
            : new Date().toLocaleTimeString();

          const prevPrice = prevData[currency].price;
          const change =
            prevPrice > 0
              ? (((calculatedPrice - prevPrice) / prevPrice) * 100).toFixed(2) +
                "%"
              : "0%";

          newPrices[currency] = { price: calculatedPrice, updated, change };
          console.log(`[PythFeed] Updated ${currency} price:`, calculatedPrice);
        }

        console.log("[PythFeed] Final new prices:", newPrices);
        return newPrices;
      });
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error("[PythFeed] Error fetching prices:", error);
      setError("Failed to fetch price data");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPrices();

    // Set up polling every 5 seconds
    const interval = setInterval(() => {
      fetchPrices();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { data, loading, error };
}

const FeedCard = ({
  symbol,
  color,
  icon,
  price,
  updated,
  change,
  prediction,
}: FeedCardProps) => (
  <div
    className={`relative rounded-2xl p-8 shadow-xl border border-white/10 bg-black/40 flex flex-col items-start justify-center min-w-[320px] w-full max-w-md mx-auto transition-all duration-300 hover:border-purple-500`}
  >
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <h2 className="text-2xl font-bold text-white">{symbol}</h2>
    </div>
    <div className="text-xs text-gray-400 mb-2">Updated: {updated}</div>
    <div className="text-4xl font-mono font-bold mb-2 text-white">
      {price
        ? `${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        : "-"}
    </div>
    
    <div className="flex justify-between w-full text-sm text-gray-300 mt-6">
      <div>
        <div className="font-bold">Source</div>
        <div>Pyth Network</div>
      </div>
      <div>
        <div className="font-bold">Pair</div>
        <div>{symbol}</div>
      </div>
    </div>
  </div>
);

const LivePredictions = ({
  roundData,
  predictions,
  currentPrice,
  loading,
}: {
  roundData: RoundData | null;
  predictions: LivePrediction[];
  currentPrice: number;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="w-full max-w-5xl bg-black/30 border border-white/10 rounded-xl p-8 mt-8">
        <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">
          Live Agent Predictions
        </h2>
        <div className="text-center text-gray-400">Loading round data...</div>
      </div>
    );
  }

  if (!roundData) {
    return (
      <div className="w-full max-w-5xl bg-black/30 border border-white/10 rounded-xl p-8 mt-8">
        <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">
          Live Agent Predictions
        </h2>
        <div className="text-center text-gray-400">No active round</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'judging': return 'text-yellow-400';
      case 'finalized': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const timeRemaining = roundData.submissionDeadline > 0 
    ? Math.max(0, roundData.submissionDeadline - Math.floor(Date.now() / 1000))
    : 0;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  console.log("[LivePredictions] Rendering with roundData:", predictions);

  return (
    <div className="w-full max-w-5xl bg-black/30 border border-white/10 rounded-xl p-8 mt-8">
      <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">
        Live Agent Predictions
      </h2>
      
      {/* Round Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-black/40 border border-white/10 rounded-lg p-4">
          <div className="text-xs text-gray-400">Round</div>
          <div className="text-xl font-bold text-white">#{roundData.roundId}</div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-4">
          <div className="text-xs text-gray-400">Status</div>
          <div className={`text-xl font-bold ${getStatusColor(roundData.status)}`}>
            {roundData.status.toUpperCase()}
          </div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-4">
          <div className="text-xs text-gray-400">Predictions</div>
          <div className="text-xl font-bold text-white">{predictions.length}</div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-4">
          <div className="text-xs text-gray-400">Time Left</div>
          <div className="text-xl font-bold text-white">
            {roundData.status === 'active' ? `${minutes}:${seconds.toString().padStart(2, '0')}` : '-'}
          </div>
        </div>
      </div>

      {/* Predictions List */}
      {predictions.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No predictions yet</div>
      ) : (
        <div className="space-y-4">
          <div className="hidden md:grid grid-cols-6 gap-4 text-sm text-gray-400 px-4">
            <div className="col-span-2">Agent</div>
            <div>Predicted</div>
            <div>Current</div>
            <div>Live Accuracy</div>
            <div>Win Rate</div>
          </div>
          {predictions.map((p, idx) => {
            const accuracy = p.accuracy;
            return (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center bg-black/40 border border-white/10 rounded-lg p-4 animate-fade-in"
              >
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-500 bg-purple-900/30 flex items-center justify-center">
                    <span className="text-purple-300 font-bold text-xs">
                      
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">
                      {p.agentAddress.slice(0, 10)}...
                    </div>
                    <div className="text-xs text-gray-400">
                      {p.bestGuesses} wins | {p.totalGuesses} total
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-green-400">
                    ${(p.predictedPrice / 1e8).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">ETH/USD</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-white">
                    ${currentPrice.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`font-bold text-lg ${
                      accuracy > 99 ? "text-green-400" : accuracy > 95 ? "text-yellow-400" : "text-red-400"
                    }`}
                  >
                    {accuracy.toFixed(2)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-purple-400">
                    {p.winRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Live = () => {
  const { data, loading: priceLoading, error: priceError } = usePythFeed();
  const { roundData, predictions: livePredictions, loading: roundLoading } = useLiveRound(data.ETH.price);

  if (priceLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0F]">
        <Sidebar activePage="live" />
        <main className="ml-16 py-20 px-4 flex flex-col items-center">
          <WalletProvider>
            <Header />
          </WalletProvider>
          <div className="text-white mt-20">Loading market data...</div>
        </main>
      </div>
    );
  }

  if (priceError || !data.ETH.price) {
    return (
      <div className="min-h-screen bg-[#0A0B0F]">
        <Sidebar activePage="live" />
        <main className="ml-16 py-20 px-4 flex flex-col items-center">
          <WalletProvider>
            <Header />
          </WalletProvider>
          <div className="text-red-500 mt-20">Error loading market data: {priceError}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0B0F]">
      <Sidebar activePage="live" />
      
      <main className="ml-16 py-20 px-4 flex flex-col items-center">
        <WalletProvider>
          <Header />
        </WalletProvider>
        <h1 className="text-4xl md:text-5xl font-bold text-purple-400 mb-4 mt-10 text-center">
          Live Oracle Feed
        </h1>
        <p className="text-lg text-gray-300 mb-12 text-center max-w-xl">
          Real-time price data from{" "}
          <span className="text-purple-400">Pyth Network</span> (Hermes API) with
          AI-based trend predictions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl mb-12">
          <FeedCard
            symbol="ETH/USD"
            color="bg-purple-600"
            icon={
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
            }
            price={data.ETH.price}
            updated={data.ETH.updated}
            change={data.ETH.change}
            prediction="Likely bullish in next 1 hour 🚀"
          />
          <FeedCard
            symbol="BTC/USD"
            color="bg-yellow-400"
            icon={
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
            }
            price={data.BTC.price}
            updated={data.BTC.updated}
            change={data.BTC.change}
            prediction="Slight bearish trend forming 📉"
          />
        </div>

        <LivePredictions 
          roundData={roundData} 
          predictions={livePredictions} 
          currentPrice={data.ETH.price}
          loading={roundLoading}
        />
      </main>
    </div>
  );
};

export default Live;
