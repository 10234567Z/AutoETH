"use client";
import React, { useEffect, useState } from "react";
import Nav from "../../components/nav";

const API_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_high=true&include_24hr_low=true&include_last_updated_at=true";

type StreamItem = {
  time: string;
  symbol: string;
  price: number;
};

type FeedCardProps = {
  symbol: string;
  color: string;
  icon: React.ReactNode;
  price: number;
  change: number;
  high: number;
  low: number;
  volume: number;
  updated: string;
};

function useCryptoFeed() {
  const [data, setData] = useState({
    ETH: {
      price: 0,
      change: 0,
      high: 0,
      low: 0,
      updated: 0,
    },
    BTC: {
      price: 0,
      change: 0,
      high: 0,
      low: 0,
      updated: 0,
    },
  });
  const [stream, setStream] = useState<StreamItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(API_URL);
      const json = await res.json();
      setData({
        ETH: {
          price: json.ethereum.usd,
          change: json.ethereum.usd_24h_change,
          high: json.ethereum.usd_24h_high,
          low: json.ethereum.usd_24h_low,
          updated: json.ethereum.last_updated_at,
        },
        BTC: {
          price: json.bitcoin.usd,
          change: json.bitcoin.usd_24h_change,
          high: json.bitcoin.usd_24h_high,
          low: json.bitcoin.usd_24h_low,
          updated: json.bitcoin.last_updated_at,
        },
      });
      setStream((prev: StreamItem[]) => [
        {
          time: new Date().toLocaleTimeString(),
          symbol: "ETH/USD",
          price: json.ethereum.usd,
        },
        {
          time: new Date().toLocaleTimeString(),
          symbol: "BTC/USD",
          price: json.bitcoin.usd,
        },
        ...prev.slice(0, 8),
      ]);
    }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);
  return { data, stream };
}

const FeedCard = ({
  symbol,
  color,
  icon,
  price,
  change,
  high,
  low,
  volume,
  updated,
}: FeedCardProps) => (
  <div
    className={`relative rounded-2xl p-8 shadow-xl border border-white/10 bg-black/40 flex flex-col items-start justify-center min-w-[320px] w-full max-w-md mx-auto transition-all duration-300 hover:border-purple-500`}
  >
    <div className="flex items-center gap-3 mb-2">
      {icon}
      <h2 className="text-2xl font-bold text-white">{symbol}</h2>
      <span
        className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${
          change < 0 ? "bg-red-900 text-red-400" : "bg-green-900 text-green-400"
        }`}
      >
        {change < 0 ? "▼" : "▲"} {change.toFixed(2)}%
      </span>
    </div>
    <div className="text-xs text-gray-400 mb-2">Updated: {updated}</div>
    <div className="text-4xl font-mono font-bold mb-2 text-white">
      ${price?.toLocaleString?.() ?? "-"}
    </div>
    <div className="w-full h-2 bg-gray-800 rounded-full mb-4">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${Math.min(100, Math.abs(change * 2))}%` }}
      />
    </div>
    <div className="flex justify-between w-full text-sm text-gray-300">
      <div>
        <div className="font-bold">24h High</div>
        <div>${high !== undefined ? high.toLocaleString() : "-"}</div>
      </div>
      <div>
        <div className="font-bold">24h Low</div>
        <div>${low !== undefined ? low.toLocaleString() : "-"}</div>
      </div>
      <div>
        <div className="font-bold">Volume</div>
        <div>$1.2B</div>
      </div>
    </div>
  </div>
);

const Live = () => {
  const { data, stream } = useCryptoFeed();
  return (
    <main className="min-h-screen bg-[#0A0B0F] py-20 px-4 flex flex-col items-center">
      <Nav />
      <h1 className="text-4xl md:text-5xl font-bold text-purple-400 mb-4 text-center">
        Live Oracle Feed
      </h1>
      <p className="text-lg text-gray-300 mb-12 text-center max-w-xl">
        Real-time price data from Pyth Network
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-4xl mb-12">
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
          change={data.ETH.change}
          high={data.ETH.high}
          low={data.ETH.low}
          volume={1.2}
          updated={new Date(data.ETH.updated * 1000).toLocaleTimeString()}
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
          change={data.BTC.change}
          high={data.BTC.high}
          low={data.BTC.low}
          volume={1.2}
          updated={new Date(data.BTC.updated * 1000).toLocaleTimeString()}
        />
      </div>
      <div className="w-full max-w-3xl bg-black/60 rounded-2xl p-8 shadow-lg border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-6">
          Truth Updates Stream
        </h2>
        <ul className="space-y-4">
          {stream.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between bg-[#181A20] rounded-xl px-6 py-3 text-white/90"
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="font-mono text-xs text-gray-400">
                  {item.time}
                </span>
                <span className="font-semibold text-white">
                  {item.symbol} updated
                </span>
              </div>
              <span className="font-mono text-purple-400 text-lg">
                ${item.price.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
};

export default Live;
