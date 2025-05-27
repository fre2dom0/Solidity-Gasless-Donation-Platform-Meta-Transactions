import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

function Navbar() {
  const { address, isOwner, connectWallet } = useWallet();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link className="navbar-brand" to="/">Donation Platform</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
            {isOwner && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/token-management">Token Management</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/receiver-management">Receiver Management</Link>
                </li>
              </>
            )}
          </ul>
          <button 
            onClick={connectWallet} 
            className="btn btn-primary"
          >
            {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 