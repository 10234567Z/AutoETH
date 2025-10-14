import React from "react";




const navLinks = [
  { name: "Home", href: "/home" },
  { name: "Live", href: "/live" },
  { name: "LeaderBoard", href: "/leaderboard" },
];

const Nav = () => {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <a href="#">Home</a>
        <a href="#">Live</a>
      </div>

      <div className="nav-center">⟠</div>

      <div className="nav-right">
        <a href="#">LeaderBoard</a>
        <a href="#">Faq</a>
      </div>
    </nav>
  );
};

export default Nav;
