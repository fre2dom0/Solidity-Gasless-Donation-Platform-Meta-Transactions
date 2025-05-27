import { createContext, useState, useContext, useEffect } from 'react';
import { DONATION_PLATFORM } from '../contracts';
import { ethers } from 'ethers';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Initialize provider without wallet connection
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.BrowserProvider(ethereum);
      setProvider(provider);
    }
  }, []);

  useEffect(() => {
    async function checkOwner() {
      if (!provider || !address) {
        setIsOwner(false);
        return;
      }
      
      try {
        const contract = new ethers.Contract(
          DONATION_PLATFORM.ADDRESS,
          DONATION_PLATFORM.ABI,
          provider
        );
        
        const ownerAddress = await contract.owner();
        setIsOwner(address.toLowerCase() === ownerAddress.toLowerCase());
      } catch (error) {
        console.error('Error checking owner:', error);
        setIsOwner(false);
      }
    }

    checkOwner();
  }, [provider, address]);

  async function connectWallet() {
    console.log('Connecting wallet...');
    const { ethereum } = window;
    if (ethereum) {
      console.log('Ethereum found ', ethereum);
      try {
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        console.log('Accounts:', accounts);
        console.log('Connected to wallet:', accounts[0]);
        setAddress(accounts[0]);
        
        const newSigner = await provider.getSigner();
        setSigner(newSigner);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      console.log('Ethereum not found');
    }
  }

  const value = {
    provider,
    signer,
    address,
    isOwner,
    connectWallet
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 