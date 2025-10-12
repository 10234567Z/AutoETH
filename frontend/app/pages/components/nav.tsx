import React from "react";
import Link from "next/link";
import Image from "next/image";

const Nav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">$</span>
              </div>
              <span className="text-white text-lg font-semibold">
                Proof Of Inteligence
              </span>
            </Link>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/blog"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              href="/developers"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Live
            </Link>
            <Link
              href="/contact"
              className="text-gray-300 hover:text-white transition-colors"
            >
              LeaderBoard
            </Link>
            <Link
              href="/launch"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-300 hover:text-white p-2"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            href="/blog"
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md"
          >
            Home
          </Link>
          <Link
            href="/developers"
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md"
          >
            Live
          </Link>
          <Link
            href="/contact"
            className="text-gray-300 hover:text-white block px-3 py-2 rounded-md"
          >
            LeaderBoard
          </Link>
          <Link
            href="/launch"
            className="bg-purple-600 text-white block px-3 py-2 rounded-md hover:bg-purple-700"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
