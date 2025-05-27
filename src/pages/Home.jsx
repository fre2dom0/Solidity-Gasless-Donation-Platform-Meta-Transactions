import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { DONATION_PLATFORM, ERC2771_FORWARDER, TEST_TOKEN, RELAYER_ADDRESS } from '../contracts';
import { createGaslessRequest, createForwardRequestSignature, executeGaslessTransaction, createPermitSignature } from '../utils/gaslessHelpers';
import { DonationHistoryService } from '../utils/donationHistory';

function Home() {
  const { provider, signer, address, connectWallet } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Donation history states
  const [donationHistory, setDonationHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalEvents: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [donationStats, setDonationStats] = useState({
    totalDonations: 0,
    totalAmount: '0',
    uniqueDonors: 0,
    uniqueReceivers: 0,
    averageDonation: '0'
  });

  const [donationForm, setDonationForm] = useState({
    token: '',
    receiver: '',
    amount: '',
    showable: true
  });

  // Initialize donation history service
  const [historyService, setHistoryService] = useState(null);

  useEffect(() => {
    if (provider) {
      const service = new DonationHistoryService(provider);
      setHistoryService(service);
      
      // Setup real-time event listener
      const cleanup = service.setupEventListener((newDonation) => {
        console.log('New donation received:', newDonation);
        // Add new donation to the beginning of the list
        setDonationHistory(prev => [newDonation, ...prev.slice(0, historyPagination.pageSize - 1)]);
        // Refresh stats
        loadDonationStats(service);
      });

      return cleanup;
    }
  }, [provider]);

  // Load donation history
  const loadDonationHistory = async (page = 1) => {
    if (!historyService) return;
    
    try {
      setHistoryLoading(true);
      const result = await historyService.getDonationHistory(page, historyPagination.pageSize);
      
      setDonationHistory(result.events);
      setHistoryPagination(result.pagination);
      
    } catch (error) {
      console.error('Error loading donation history:', error);
      setError('Failed to load donation history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load donation statistics
  const loadDonationStats = async (service = historyService) => {
    if (!service) return;
    
    try {
      const stats = await service.getDonationStats();
      setDonationStats(stats);
    } catch (error) {
      console.error('Error loading donation stats:', error);
    }
  };

  useEffect(() => {
    async function fetchTokens() {
      if (!provider) return;
      
      try {
        setLoading(true);
        const contract = new ethers.Contract(
          DONATION_PLATFORM.ADDRESS,
          DONATION_PLATFORM.ABI,
          provider
        );
        
        const tokenList = await contract.getAllTokens();
        console.log(tokenList)
        setTokens(tokenList);
        
        const receiverList = await contract.getAllReceivers();
        console.log(receiverList)
        setReceivers(receiverList);
        
        setError(null);

      } catch (error) {
        console.error('Error fetching tokens:', error);
        setError('Failed to load tokens. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchTokens();
  }, [provider]);

  // Load donation history when service is ready
  useEffect(() => {
    if (historyService) {
      loadDonationHistory(1);
      loadDonationStats();
    }
  }, [historyService]);

  // Initialize Bootstrap tooltips
  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    // Cleanup tooltips on unmount
    return () => {
      tooltipList.forEach(tooltip => tooltip.dispose());
    };
  }, [donationHistory]); // Re-initialize when donation history changes

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDonationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Main gasless donation function
  const makeGaslessDonation = async () => {
    try {
      // Validate form inputs
      if (!donationForm.token || !donationForm.receiver || !donationForm.amount) {
        throw new Error("Please fill in all required fields");
      }

      if (!signer) {
        throw new Error("Please connect your wallet first");
      }

      console.log('Starting gasless donation process...');
      
      // Parse amount to wei
      const amount = ethers.parseEther(donationForm.amount);
      
      // Create contract instances
      const token = new ethers.Contract(donationForm.token, TEST_TOKEN.ABI, provider);
      
      // Check user's token balance
      const userAddress = await signer.getAddress();
      const balance = await token.balanceOf(userAddress);
      
      if (balance < amount) {
        throw new Error(`Insufficient token balance. You have ${ethers.formatEther(balance)} tokens, but trying to donate ${ethers.formatEther(amount)}`);
      }

      console.log('Creating permit signature...');
      
      // Step 1: Create permit signature (gasless approval)
      const permitSignature = await createPermitSignature(
        signer,
        token,
        amount,
        DONATION_PLATFORM.ADDRESS // spender
      );

      console.log('Permit signature created successfully');

      // Step 2: Create gasless request for donateToken function
      const functionArgs = [
        donationForm.token,           // tokenAddress
        donationForm.receiver,        // receiver
        amount,                       // amount
        donationForm.showable,        // showable
        permitSignature.deadline,     // deadline
        permitSignature.v,            // v
        permitSignature.r,            // r
        permitSignature.s             // s
      ];

      console.log('Creating gasless request...');
      
      const forwardRequest = await createGaslessRequest(
        signer,
        provider,
        'donateToken',
        functionArgs,
        400000 // estimated gas
      );

      console.log('Forward request created successfully');

      // Step 3: Sign the forward request
      const forwardSignature = await createForwardRequestSignature(signer, forwardRequest);

      console.log('Forward request signed successfully');

      // Step 4: Execute gasless transaction via relayer
      console.log('Executing gasless transaction via relayer...');
      
      const receipt = await executeGaslessTransaction(
        forwardRequest,
        forwardSignature,
        provider
      );

      console.log('Gasless donation completed successfully!', receipt);
      
      return receipt;

    } catch (error) {
      console.error('Gasless donation failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address) {
      await connectWallet();
      return;
    }
    
    try {
      setLoading(true);
      console.log('Starting gasless donation:', donationForm);
      
      const receipt = await makeGaslessDonation();
      
      console.log('Donation successful!', receipt);
      alert(`🎉 Gasless donation completed successfully! 

Transaction Hash: ${receipt.transactionHash}
Gas paid by relayer: ${ethers.formatEther(receipt.gasUsed * receipt.gasPrice || 0)} ETH
You paid: 0 ETH (Gas-Free!)

Your donation has been processed without any gas fees!`);
      
      // Reset form
      setDonationForm({
        token: '',
        receiver: '',
        amount: '',
        showable: true
      });

      // Refresh donation history and stats
      setTimeout(() => {
        loadDonationHistory(1);
        loadDonationStats();
      }, 2000); // Wait 2 seconds for the event to be mined
      
    } catch (error) {
      console.error('Donation failed:', error);
      let errorMessage = error.message;
      
      // Provide more specific error messages
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient token balance for this donation amount.';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (error.message.includes('Please fill in all required fields')) {
        errorMessage = 'Please fill in all required fields before submitting.';
      }
      
      alert(`❌ Gasless donation failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-4">Processing...</div>;
  if (error) return <div className="alert alert-danger m-4">{error}</div>;


  return (
    <div className="container py-4">
      {/* Donation Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="mb-0">Make a Donation</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Token:</label>
              <select 
                name="token" 
                value={donationForm.token}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">Select Token</option>
                {tokens.filter(token => token._isActive).map(token => (
                  <option key={token._address} value={token._address}>
                    {token._symbol} - {token._name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Receiver:</label>
              <select 
                name="receiver" 
                value={donationForm.receiver}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">Select Receiver</option>
                {receivers.map(receiver => (
                  console.log(receiver[0]),
                  <option key={receiver._address} value={receiver._address}>
                    {receiver._name} - {receiver._description}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Amount:</label>
              <input
                type="number"
                name="amount"
                value={donationForm.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                className="form-control"
              />
            </div>

            <div className="mb-3 form-check">
              <input
                type="checkbox"
                name="showable"
                checked={donationForm.showable}
                onChange={handleInputChange}
                className="form-check-input"
                id="showableCheck"
              />
              <label className="form-check-label" htmlFor="showableCheck">
                Make my donation public
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing Gasless Donation...' : 
               !address ? 'Connect Wallet to Donate' : 
               'Donate (Gas-Free)'}
            </button>
          </form>
        </div>
      </div>

      {/* Donation Statistics */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{donationStats.totalDonations}</h5>
              <p className="card-text">Total Donations</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{donationStats.totalAmount}</h5>
              <p className="card-text">Total Amount</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{donationStats.uniqueDonors}</h5>
              <p className="card-text">Unique Donors</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="card-title">{donationStats.averageDonation}</h5>
              <p className="card-text">Average Donation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Donation History */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Donation History</h2>
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => loadDonationHistory(historyPagination.currentPage)}
            disabled={historyLoading}
          >
            {historyLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="card-body">
          {historyLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading donation history...</p>
            </div>
          ) : donationHistory.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No donations found</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Donor</th>
                      <th>Receiver</th>
                      <th>Amount</th>
                      <th>Token</th>
                      <th>Date</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donationHistory.map(donation => {
                      // Find receiver name from receivers list
                      const receiverInfo = receivers.find(r => r._address.toLowerCase() === donation.receiver.toLowerCase());
                      const receiverName = receiverInfo ? receiverInfo._name : `${donation.receiver.slice(0, 6)}...${donation.receiver.slice(-4)}`;
                      
                      return (
                        <tr key={donation.id}>
                          <td>
                            <span className="font-monospace">
                              {donation.donor.slice(0, 6)}...{donation.donor.slice(-4)}
                            </span>
                          </td>
                          <td>
                            <strong>{receiverName}</strong>
                          </td>
                          <td>
                            <strong>{parseFloat(donation.amount).toFixed(4)}</strong>
                          </td>
                          <td>
                            <span className="badge bg-primary">{donation.tokenSymbol}</span>
                          </td>
                          <td>{donation.date}</td>
                          <td>{donation.time}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historyPagination.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted">
                    Showing {historyPagination.startIndex}-{historyPagination.endIndex} of {historyPagination.totalEvents} donations
                  </div>
                  
                  <nav aria-label="Donation history pagination">
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${!historyPagination.hasPrevPage ? 'disabled' : ''}`}>
                        <button 
                          className="page-link"
                          onClick={() => loadDonationHistory(historyPagination.currentPage - 1)}
                          disabled={!historyPagination.hasPrevPage || historyLoading}
                        >
                          Previous
                        </button>
                      </li>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, historyPagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, historyPagination.currentPage - 2) + i;
                        if (pageNum <= historyPagination.totalPages) {
                          return (
                            <li key={pageNum} className={`page-item ${pageNum === historyPagination.currentPage ? 'active' : ''}`}>
                              <button 
                                className="page-link"
                                onClick={() => loadDonationHistory(pageNum)}
                                disabled={historyLoading}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        }
                        return null;
                      })}
                      
                      <li className={`page-item ${!historyPagination.hasNextPage ? 'disabled' : ''}`}>
                        <button 
                          className="page-link"
                          onClick={() => loadDonationHistory(historyPagination.currentPage + 1)}
                          disabled={!historyPagination.hasNextPage || historyLoading}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home; 