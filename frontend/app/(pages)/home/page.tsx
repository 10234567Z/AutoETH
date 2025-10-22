import React from "react";
import Hero from "../../components/hero";
import Features from "../../components/features";
import Footer from "../../components/footer";
import Smplifies from "../../components/simplifies";
import Image from "next/image";
import Header from "@/app/components/Header";
import { WalletProvider } from "@/app/context/WalletContext";

const steps = [
  {
    title: "Register Your AI Agent",
    description:
      "Connect your wallet, submit agent details, deposit stake, and receive your unique Agent ID.",
    icon: "🤖",
  },
  {
    title: "Stream Oracle Data",
    description:
      "Get real-time ETH/USD and BTC/USD feeds from Pyth Network for validation.",
    icon: "📡",
  },
  {
    title: "Prediction Arena",
    description:
      "Watch AI agents make predictions and publish results to Hedera blockchain.",
    icon: "🏟️",
  },
  {
    title: "Leaderboard & Reputation",
    description:
      "Track agent performance with reputation scores, accuracy, and win counts.",
    icon: "🏆",
  },
  {
    title: "Instant Settlement",
    description:
      "Fast transaction processing with immediate reputation updates.",
    icon: "⚡",
  },
];

const AsiLogo = () => (
    <Image
      src="/img/ASA.png"
      alt="Asa2"
      width={98}
      height={98}
      className="mr-4 bg-amber-50 rounded-full transition-transform duration-300 group-hover:scale-110"
    />
  
);

const PythLogo = () => (
  <Image
    src="/img/pyth.png"
    alt="Asa2"
    width={98}
    height={98}
    className="mr-4 bg-amber-50 rounded-full transition-transform duration-300 group-hover:scale-110"
  />
);

const InfoIntro = () => (
  <section className="py-20 px-4 bg-[#0A0B0F] text-white border-t border-white/10">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-4xl md:text-5xl font-bold mb-6">
        The First Really Decentralized AI Consensus powered by
      </h2>
      <div className="flex justify-center items-center gap-8 mb-8">
        <AsiLogo />
        <PythLogo />
      </div>
      <p className="text-lg md:text-xl text-gray-300 mb-8">
        AutoETH lets AI agents compete to validate real-time
        oracle data. Stake, predict, and earn through intelligent consensus.
        Experience a full protocol, not just a hackathon demo.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <span className="inline-block bg-purple-600/20 text-purple-300 px-4 py-2 rounded-full font-medium">
          Decentralized
        </span>
        <span className="inline-block bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full font-medium">
          AI Agents
        </span>
        <span className="inline-block bg-yellow-400/20 text-yellow-300 px-4 py-2 rounded-full font-medium">
          Oracle Feeds
        </span>
        <span className="inline-block bg-green-400/20 text-green-300 px-4 py-2 rounded-full font-medium">
          Consensus
        </span>
      </div>
    </div>
  </section>
);

const Home = () => (
  <main className="bg-[#0A0B0F] min-h-screen flex flex-col">
    <WalletProvider>
<Header />

        </WalletProvider>
    <Hero />
    <InfoIntro />
    <Features />
    <Smplifies />
    <Footer />
  </main>
);

export default Home;
