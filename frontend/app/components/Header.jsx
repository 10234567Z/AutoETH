import Navbar from "./Navbars";
import WalletButton from "./WalletButton";
import "./Navbar.css";

export default function Header() {
  return (
    <header className="site-header">
      <Navbar />
      <WalletButton />
    </header>
  );
}
