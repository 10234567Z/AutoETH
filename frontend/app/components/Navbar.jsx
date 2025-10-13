import React from "react";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <a href="#">Home</a>
        <a href="#">Live</a>
      </div>

      <div className="nav-center">⟠</div>

      <div className="nav-right">
        <a href="#">LeaderBoard</a>
        <a href="#">Login</a>
      </div>
    </nav>
  );
}
