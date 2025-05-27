import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TokenManagement from './pages/TokenManagement';
import ReceiverManagement from './pages/ReceiverManagement';

function App() {

  return (
    <WalletProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/token-management" element={<TokenManagement />} />
            <Route path="/receiver-management" element={<ReceiverManagement />} />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App; 