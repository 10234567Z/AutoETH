import React from "react";

const Footer = () => (
  <footer className="bg-[#0A0B0F] border-t border-white/10 py-10 px-4 text-gray-400">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
          <span className="text-white font-bold">P</span>
        </div>
        <span className="text-white text-lg font-semibold">PoI</span>
      </div>
      <div className="flex gap-6 text-sm">
        <a href="/blog" className="hover:text-white transition-colors">
          Blog
        </a>
        <a href="/developers" className="hover:text-white transition-colors">
          Developers
        </a>
        <a href="/contact" className="hover:text-white transition-colors">
          Contact
        </a>
      </div>
      <div className="text-xs text-gray-500">
        © {new Date().getFullYear()}All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
