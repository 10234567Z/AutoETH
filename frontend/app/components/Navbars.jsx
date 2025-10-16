"use client";
import React from "react";
import Link from "next/link";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/agents">Agents</Link>
      </div>

      <div className="nav-center">⟠</div>

      <div className="nav-right">
        <Link href="/leaderboard">Block</Link>
        <Link href="/login">Signout</Link>
      </div>
    </nav>
  );
}
