"use client";
import React from "react";
import Image from "next/image";

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
    <div className="max-w-7xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-purple-500 via-purple-400 to-blue-500 bg-clip-text text-transparent">
        Key Features
      </h2>
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        {/* Features Grid */}
        <div className="w-full lg:w-3/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="group bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-purple-500/20 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white/90">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 w-12 h-1 bg-gradient-to-r from-purple-500 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>

        {/* GIF Section */}
        <div className="w-full lg:w-2/5">
          <Image
            src="/img/newbg.gif"
            alt="AI background"
            width={400}
            height={400}
            className="rounded-2xl"
          />
        </div>
      </div>
    </div>
  </section>
);

export default Features;
