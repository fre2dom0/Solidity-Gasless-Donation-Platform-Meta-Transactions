import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';
import { DONATION_PLATFORM } from '../contracts';
import { createGaslessRequest, createForwardRequestSignature, executeGaslessTransaction } from '../utils/gaslessHelpers';

function TokenManagement() {
  
  const { provider, signer, address, isOwner } = useWallet();
  const [newToken, setNewToken] = useState({
    address: '',
    name: '',
    symbol: ''
  });

  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!provider) return;
      
      try {
        const contract = new ethers.Contract(
          DONATION_PLATFORM.ADDRESS,
          DONATION_PLATFORM.ABI,
          provider
        );

        const tokenList = await contract.getAllTokens();
        setTokens(tokenList);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    }

    fetchTokens();
  }, [provider, newToken, tokens]);


  const addToken = async (e) => {
    e.preventDefault();
    if (!signer) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      // Create gasless request for addTokenGasless function
      const forwardRequest = await createGaslessRequest(signer, provider, 'addTokenGasless', [newToken.address, newToken.name, newToken.symbol], 300000);

      // Create EIP-712 signature
      const signature = await createForwardRequestSignature(signer, forwardRequest);

      // Execute gasless transaction via relayer
      const receipt = await executeGaslessTransaction(forwardRequest, signature, provider);
      
      alert(`🎉 Token added successfully (Gas-Free)!\n\nTransaction Hash: ${receipt.hash}\nGas paid by relayer: ${ethers.formatEther(receipt.gasUsed * receipt.gasPrice || 0)} ETH\nYou paid: 0 ETH`);
      setNewToken({ address: '', name: '', symbol: '' }); 
    } catch (error) {
      console.error('Error adding token:', error);
      let errorMessage = 'Failed to add token: ' + error.message;

      if (error.message.includes('Only owner')) {
        errorMessage = 'Only the platform owner can add token.';
      } else if (error.message.includes('Invalid token address')) {
        errorMessage = 'Please enter a valid token address.';
      } else if (error.message.includes('Token already exists')) {
        errorMessage = 'This token address is already registered.';
      }

      alert('Failed to add token: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteToken = async (address) => {
    if (!signer) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      // Create gasless request for removeTokenGasless function
      const forwardRequest = await createGaslessRequest(signer, provider, 'removeTokenGasless', [address], 300000);

      // Create EIP-712 signature
      const signature = await createForwardRequestSignature(signer, forwardRequest);

      // Execute gasless transaction via relayer
      const receipt = await executeGaslessTransaction(forwardRequest, signature, provider);
      
      
      alert('Token removed successfully!');
      setTokens(tokens.filter(token => token.address !== address));
    } catch (error) {
      console.error('Error removing token:', error);
      let errorMessage = 'Failed to add token: ' + error.message;

      if (error.message.includes('Only owner')) {
        errorMessage = 'Only the platform owner can add token.';
      } else if (error.message.includes('Invalid token address')) {
        errorMessage = 'Please enter a valid token address.';
      } else if (error.message.includes('Token does not exist')) {
        errorMessage = 'This token address does not exist.';
      }

      alert('Failed to add token: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleTokenStatus = async (address) => {
     if (!signer) {
      alert('Please connect your wallet first');
      return;
    } 
    try {
      setLoading(true);
      // Create gasless request for removeTokenGasless function
      const forwardRequest = await createGaslessRequest(signer, provider, 'updateTokenActivityGasless', [address], 300000);

      // Create EIP-712 signature
      const signature = await createForwardRequestSignature(signer, forwardRequest);

      // Execute gasless transaction via relayer
      const receipt = await executeGaslessTransaction(forwardRequest, signature, provider);
     

      setTokens(tokens.map(token => 
        token.address === address 
          ? { ...token, isActive: !token.isActive }
          : token
      ));
      alert('Token activity updated successfully!');
    } catch (error) {
      console.error('Error updating token:', error);
      let errorMessage = 'Failed to add token: ' + error.message;

      if (error.message.includes('Only owner')) {
        errorMessage = 'Only the platform owner can add token.';
      } else if (error.message.includes('Invalid token address')) {
        errorMessage = 'Please enter a valid token address.';
      } else if (error.message.includes('Token does not exist')) {
        errorMessage = 'This token address does not exist.';
      }

      alert('Failed to add token: ' + errorMessage);
    } finally {
      setLoading(false);
    }


  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewToken(prev => ({
      ...prev,
      [name]: value
    }));
  };


  return (
    <div className="container py-4">
      {!isOwner ? (
        <div className="alert alert-warning">
          Only the contract owner can manage tokens.
        </div>
      ) : (
        <>
          <div className="card mb-4">
            <div className="card-header">
              <h2 className="mb-0">Add New Token</h2>
            </div>
            <div className="card-body">
              <form onSubmit={addToken}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Token Address:</label>
                    <input
                      type="text"
                      name="address"
                      value={newToken._address}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="0x..."
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Token Name:</label>
                    <input
                      type="text"
                      name="name"
                      value={newToken._name}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Ethereum"
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Token Symbol:</label>
                    <input
                      type="text"
                      name="symbol"
                      value={newToken._symbol}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="ETH"
                      required
                    />
                  </div>
                </div>
                <button disabled={loading} type="submit" className="btn btn-primary">
                  {loading ? 'Adding Token (Gas-Free)...' : 'Add Token (Gas-Free)'}
                </button>
              </form>
            </div>
          </div>

          {/* Tokens List */}
          <div className="card">
            <div className="card-header">
              <h2 className="mb-0">Token List</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Name</th>
                      <th>Symbol</th>
                      <th>Total Donations</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map(token => (
                      <tr key={token._address}>
                        <td>{token._address}</td>
                        <td>{token._name}</td>
                        <td>{token._symbol}</td>
                        <td>{token._totalDonationAmount}</td>
                        <td>
                          <span className={`badge ${token._isActive ? 'bg-success' : 'bg-danger'}`}>
                            {token._isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              disabled={loading}
                              onClick={() => toggleTokenStatus(token._address)}
                              className={`btn btn-sm ${token._isActive ? 'btn-warning' : 'btn-success'}`}
                            >
                              {token._isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              disabled={loading}
                              onClick={() => deleteToken(token._address)}
                              className="btn btn-sm btn-danger"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TokenManagement; 