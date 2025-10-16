"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";

import { getPythPriceUpdateFromEventSource } from "@pythnetwork/pyth-evm-js";

const HERMES_URL = "https://hermes.pyth.network";

const PRICE_IDS = [
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", // ETH/USD
  "0xc96458d393fe9deb7a7d63a0ac41e2898a67a7750dbd166673279e06c868df0a", // BTC/USD
];

const PYTH_SYMBOLS: Record<string, string> = {
  "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43":
    "ETH/USD",
  "0xc96458d393fe9deb7a7d63a0ac41e2898a67a7750dbd166673279e06c868df0a":
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

  useEffect(() => {
    const evtSource = new EventSource(
      `${HERMES_URL}/v2/updates/price/stream?` +
        `ids[]=${PRICE_IDS[0]}&ids[]=${PRICE_IDS[1]}`
    );

    evtSource.onmessage = (event) => {
      try {
        const updates = JSON.parse(event.data);
        if (!Array.isArray(updates)) return;

        const prices = {
          ETH: { ...data.ETH },
          BTC: { ...data.BTC },
        };

        for (const update of updates) {
          const symbol = PYTH_SYMBOLS[update.id];
          if (!symbol) continue;

          const basePrice = update.price.price;
          const expo = update.price.expo;
          const price = basePrice * Math.pow(10, expo);
          const updated = update.price.publish_time
            ? new Date(update.price.publish_time * 1000).toLocaleTimeString()
            : "-";

          const prevPrice =
            symbol === "ETH/USD" ? data.ETH.price : data.BTC.price;
          const change =
            prevPrice > 0
              ? (((price - prevPrice) / prevPrice) * 100).toFixed(2) + "%"
              : "0%";

          if (symbol === "ETH/USD") {
            prices.ETH = { price, updated, change };
          }
          if (symbol === "BTC/USD") {
            prices.BTC = { price, updated, change };
          }
        }

        setData(prices);
      } catch (e) {
        console.error("Error processing price update:", e);
      }
    };

    evtSource.onerror = (error) => {
      console.error("Error in price feed:", error);
      evtSource.close();
    };

    return () => {
      evtSource.close();
    };
  }, []);

  return data;
}

const usePredictions = () => {
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    const agentNames = [
      "AlphaBot",
      "Oraculus",
      "Predictrix",
      "ChainMind",
      "DataWolf",
    ];
    const currencyPairs = ["ETH/USD", "BTC/USD"];
    const basePrices: { [key: string]: number } = {
      "ETH/USD": 3500,
      "BTC/USD": 60000,
    };

    const predictionInterval = setInterval(() => {
      const agentName =
        agentNames[Math.floor(Math.random() * agentNames.length)];
      const currencyPair =
        currencyPairs[Math.floor(Math.random() * currencyPairs.length)];

      const basePrice = basePrices[currencyPair];
      const predictionType = Math.random() > 0.5 ? "UP" : "DOWN";
      const predictedPrice = basePrice * (1 + (Math.random() - 0.49) * 0.02); // +/- 1% of base

      const newPrediction = {
        id: Date.now(),
        agentName,
        agentAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${agentName}`,
        agentReputation: Math.floor(Math.random() * 200) + 800,
        currencyPair,
        predictedPrice,
        predictionDirection: predictionType,
        confidence: Math.random() * 0.3 + 0.7, // 70% - 100%
        stake: Math.floor(Math.random() * 100) + 1,
        timestamp: Date.now(),
      };
      setPredictions((prev) => [newPrediction, ...prev.slice(0, 4)]);
    }, 3000);

    return () => clearInterval(predictionInterval);
  }, []);

  return predictions;
};

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
    <div
      className={`text-sm font-semibold ${
        change?.includes("-") ? "text-red-400" : "text-green-400"
      }`}
    >
      {change}
    </div>
    {prediction && (
      <div className="mt-4 text-sm text-gray-300">
        <span className="font-semibold text-purple-400">AI Prediction:</span>{" "}
        {prediction}
      </div>
    )}
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

interface Prediction {
  id: number;
  agentName: string;
  agentAvatar: string;
  agentReputation: number;
  currencyPair: string;
  predictedPrice: number;
  predictionDirection: string;
  confidence: number;
  stake: number;
  timestamp: number;
}

interface Prices {
  [key: string]: {
    price: number;
    updated: string;
    change: string;
  };
}

const LivePredictions = ({
  predictions,
  prices,
}: {
  predictions: Prediction[];
  prices: Prices;
}) => (
  <div className="w-full max-w-5xl bg-black/30 border border-white/10 rounded-xl p-8 mt-8">
    <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">
      Live Agent Predictions
    </h2>
    <div className="space-y-4">
      <div className="hidden md:grid grid-cols-6 gap-4 text-sm text-gray-400 px-4">
        <div className="col-span-2">Agent</div>
        <div>Prediction</div>
        <div>Live Price</div>
        <div>Accuracy</div>
        <div>Stake</div>
      </div>
      {predictions.map((p) => {
        const currency = p.currencyPair.split("/")[0];
        const livePrice = prices[currency]?.price || 0;
        const accuracy =
          livePrice > 0
            ? 100 - (Math.abs(p.predictedPrice - livePrice) / livePrice) * 100
            : 100;
        return (
          <div
            key={p.id}
            className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center bg-black/40 border border-white/10 rounded-lg p-4 animate-fade-in"
          >
            <div className="col-span-2 flex items-center gap-3">
              <img
                src={p.agentAvatar}
                alt={p.agentName}
                className="w-10 h-10 rounded-full border-2 border-purple-500"
              />
              <div>
                <div className="font-bold text-white">{p.agentName}</div>
                <div className="text-xs text-gray-400">
                  Rep: {p.agentReputation} | Conf:{" "}
                  {(p.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            <div className="text-center">
              <div
                className={`font-bold text-lg ${
                  p.predictionDirection === "UP"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {p.predictionDirection === "UP" ? "▲" : "▼"} $
                {p.predictedPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">{p.currencyPair}</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-white">
                $
                {livePrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
            <div className="text-center">
              <div
                className={`font-bold text-lg ${
                  accuracy > 99.9 ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {accuracy.toFixed(2)}%
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-white">{p.stake}</div>
              <div className="text-xs text-gray-500">XYZ</div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const Live = () => {
  const data = usePythFeed();
  const predictions = usePredictions();

  return (
    <main className="min-h-screen bg-[#0A0B0F] py-20 px-4 flex flex-col items-center">
      <Navbar />
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

      <LivePredictions predictions={predictions} prices={data} />
    </main>
  );
};

export default Live;
