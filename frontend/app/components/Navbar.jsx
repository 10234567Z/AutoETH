"use client";
import React from "react";
import Link from "next/link";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link href="/pages/home">Home</Link>
        <Link href="/live">Live</Link>
      </div>

      <div className="nav-center">⟠</div>

      <div className="nav-right">
        <Link href="/pages/leaderboard">LeaderBoard</Link>
        <Link href="/pages/login">Login</Link>
      </div>
    </nav>
  );
}
