"use client";
import React, { useEffect, useState } from "react";
import Nav from "../../components/nav";
import Navbar from "../../components/Navbar";

const FEATURED_API_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd&include_24hr_change=true&include_24hr_high=true&include_24hr_low=true&include_last_updated_at=true";
const OTHER_COINS_API_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false";

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
    ETH: { price: 0, change: 0, high: 0, low: 0, updated: 0 },
    BTC: { price: 0, change: 0, high: 0, low: 0, updated: 0 },
    SOL: { price: 0, change: 0, high: 0, low: 0, updated: 0 },
  });
  const [otherCoins, setOtherCoins] = useState([]);

  useEffect(() => {
    async function fetchFeaturedData() {
      const res = await fetch(FEATURED_API_URL);
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
        SOL: {
            price: json.solana.usd,
            change: json.solana.usd_24h_change,
            high: json.solana.usd_24h_high,
            low: json.solana.usd_24h_low,
            updated: json.solana.last_updated_at,
        },
      });
    }

    async function fetchOtherCoins() {
        const res = await fetch(OTHER_COINS_API_URL);
        const json = await res.json();
        setOtherCoins(json);
    }

    fetchFeaturedData();
    fetchOtherCoins();
    const interval = setInterval(fetchFeaturedData, 5000);
    const otherCoinsInterval = setInterval(fetchOtherCoins, 5000);
    return () => {
        clearInterval(interval);
        clearInterval(otherCoinsInterval);
    }
  }, []);
  return { data, otherCoins };
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

type OtherCurrency = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
};

type OtherCurrenciesProps = {
  coins: OtherCurrency[];
};

const OtherCurrencies = ({ coins }: OtherCurrenciesProps) => (
    <div className="w-full max-w-6xl bg-black/60 rounded-2xl p-8 shadow-lg border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-6">Other Currencies</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="p-4">#</th>
            <th className="p-4">Coin</th>
            <th className="p-4">Price</th>
            <th className="p-4">24h Change</th>
            <th className="p-4">Market Cap</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin, index) => (
            <tr key={coin.id} className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="p-4 text-gray-400">{index + 1}</td>
              <td className="p-4 flex items-center">
                <img src={coin.image} alt={coin.name} className="w-6 h-6 mr-4" />
                <span className="font-bold text-white">{coin.name}</span>
                <span className="text-gray-400 ml-2">{coin.symbol.toUpperCase()}</span>
              </td>
              <td className="p-4 font-mono text-white">${coin.current_price.toLocaleString()}</td>
              <td className={`p-4 ${coin.price_change_percentage_24h < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {coin.price_change_percentage_24h.toFixed(2)}%
              </td>
              <td className="p-4 text-white">${coin.market_cap.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

const Live = () => {
  const { data, otherCoins } = useCryptoFeed();
  return (
    <main className="min-h-screen bg-[#0A0B0F] py-20 px-4 flex flex-col items-center">
      <Navbar />
      <h1 className="text-4xl md:text-5xl font-bold text-purple-400 mb-4 mt-10 text-center">
        Live Oracle Feed
      </h1>
      <p className="text-lg text-gray-300 mb-12 text-center max-w-xl">
        Real-time price data from Pyth Network
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-6xl mb-12">
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
        <FeedCard
          symbol="SOL/USD"
          color="bg-green-400"
          icon={
            <svg
              className="w-8 h-8 text-green-300"
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
          price={data.SOL.price}
          change={data.SOL.change}
          high={data.SOL.high}
          low={data.SOL.low}
          volume={1.2}
          updated={new Date(data.SOL.updated * 1000).toLocaleTimeString()}
        />
      </div>
      <OtherCurrencies coins={otherCoins} />
    </main>
  );
};

export default Live;
