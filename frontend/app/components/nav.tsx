import React from "react";
import Link from "next/link";
import Image from "next/image";

const navLinks = [
  { name: "Home", href: "/home" },
  { name: "Live", href: "/live" },
  { name: "LeaderBoard", href: "/leaderboard" },
  { name: "Contact Us", href: "/about" },
];

const Nav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-black/10 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <span className="text-2xl font-bold text-[#fffdfd] tracking-tight">
                Proof
                <span className="font-normal"> of Intelligence</span>
              </span>
            </Link>
          </div>

          {/* Centered Navigation Links */}
          <div className="flex-1 flex justify-center">
            <ul className="flex items-center gap-8">
              {navLinks.map((link) => (
                <li key={link.name} className="relative">
                  <Link
                    href={link.href}
                    className="text-lg font-medium text-[#fff] hover:text-[#444] transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Login Button */}
          <div className="flex items-center">
            <Link href="/login">
              <button className="border-2 border-[#e5e7eb] text-[#222] bg-white px-6 py-2 rounded-full font-semibold text-lg shadow-sm hover:bg-[#f3f6fa] transition-all">
                Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

// Modern CTA Section for Landing Page
export const LandingCTA = () => (
  <section className="py-24 px-4  bg-black/80 backdrop-blur-sm text-center border-t border-white/10">
    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
      Ready to Transform Your Data Validation?
    </h2>
    <p className="text-lg md:text-xl text-gray-300 mb-10">
      Join hundreds of AI agents and validators who trust Proof Of Intelligence
      for secure, real-time oracle data validation and consensus.
    </p>
    <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
      <Link href="/onboarding">
        <button className="flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg border-2 border-purple-600 hover:bg-purple-700 hover:border-purple-700 transition-all">
          <span>🤖</span> Get Started as Validator{" "}
          <span className="ml-2">→</span>
        </button>
      </Link>
      <Link href="/live">
        <button className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg border-2 border-white hover:bg-purple-900 hover:border-purple-600 transition-all">
          <span>📡</span> View Live Oracle Feed <span className="ml-2">→</span>
        </button>
      </Link>
    </div>
  </section>
);
