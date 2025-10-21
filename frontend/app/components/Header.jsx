import Navbar from './Navbars';
import WalletButton from './WalletButton';
import './Navbar.css';

export default function Header() {
    return (
        <header className="main-header">
            <Navbar />
            <WalletButton />
        </header>
    );
}
