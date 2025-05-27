import { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';
import { DONATION_PLATFORM } from '../contracts';
import { createGaslessRequest, createForwardRequestSignature, executeGaslessTransaction } from '../utils/gaslessHelpers';

function ReceiverManagement() {
  const { provider, signer, address, isOwner } = useWallet();
  const [newReceiver, setNewReceiver] = useState({
    address: '',
    name: '',
    description: ''
  });

  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReceivers = async () => {
      if (!provider) return;
      
      try {
        const contract = new ethers.Contract(
          DONATION_PLATFORM.ADDRESS,
          DONATION_PLATFORM.ABI,
          provider
        );

        const receiverList = await contract.getAllReceivers();
        setReceivers(receiverList);
      } catch (error) {
        console.error('Error fetching receivers:', error);
      }
    }

    fetchReceivers();
  }, [provider, newReceiver, receivers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReceiver(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addReceiver = async (e) => {
    e.preventDefault();
    if (!signer) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      // Create gasless request for addReceiverGasless function
      const forwardRequest = await createGaslessRequest(signer, provider, 'addReceiverGasless', [newReceiver.address, newReceiver.name, newReceiver.description], 300000);

      // Create EIP-712 signature
      const signature = await createForwardRequestSignature(signer, forwardRequest);

      // Execute gasless transaction via relayer
      const receipt = await executeGaslessTransaction(forwardRequest, signature, provider);

      alert(`🎉 Receiver added successfully (Gas-Free)!\n\nTransaction Hash: ${receipt.hash}\nGas paid by relayer: ${ethers.formatEther(receipt.gasUsed * receipt.gasPrice || 0)} ETH\nYou paid: 0 ETH`);
      
      // Reset form
      setNewReceiver({ address: '', name: '', description: '' });
      
    } catch (error) {
      console.error('Error adding receiver:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('Only owner')) {
        errorMessage = 'Only the platform owner can add receivers.';
      } else if (error.message.includes('Invalid receiver address')) {
        errorMessage = 'Please enter a valid receiver address.';
      } else if (error.message.includes('Receiver already exists')) {
        errorMessage = 'This receiver address is already registered.';
      }

      alert('Failed to add receiver: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteReceiver = async (address) => {
    if (!signer) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      // Create gasless request for removeReceiverGasless function
      const forwardRequest = await createGaslessRequest(signer, provider, 'removeReceiverGasless', [address], 300000);

      // Create EIP-712 signature
      const signature = await createForwardRequestSignature(signer, forwardRequest);

      // Execute gasless transaction via relayer
      const receipt = await executeGaslessTransaction(forwardRequest, signature, provider);
      
      setReceivers(receivers.filter(receiver => receiver.address !== address));
      alert('Receiver removed successfully!');
    } catch (error) {
      console.error('Error removing receiver:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('Only owner')) {
        errorMessage = 'Only the platform owner can add receivers.';
      } else if (error.message.includes('Invalid receiver address')) {
        errorMessage = 'Please enter a valid receiver address.';
      } else if (error.message.includes('Receiver does not exist')) {
        errorMessage = 'This receiver address does not exist.';
      }

      alert('Failed to remove receiver: ' + errorMessage);
    } finally {
      setLoading(false);
    }


  };

  const toggleReceiverStatus = async (address) => {
    if (!signer) {
      alert('Please connect your wallet first');
      return;
    } 
    try {
      setLoading(true);
      // Create gasless request for updateReceiverActivityGasless function
      const forwardRequest = await createGaslessRequest(signer, provider, 'updateReceiverActivityGasless', [address], 300000);

      // Create EIP-712 signature
      const signature = await createForwardRequestSignature(signer, forwardRequest);

      // Execute gasless transaction via relayer
      const receipt = await executeGaslessTransaction(forwardRequest, signature, provider);

      const contract = new ethers.Contract(
        DONATION_PLATFORM.ADDRESS,
        DONATION_PLATFORM.ABI,
        signer 
      );
      setReceivers(receivers.map(receiver => 
        receiver.address === address 
          ? { ...receiver, isActive: !receiver.isActive }
          : receiver
      ));
      alert('Receiver activity updated successfully!');
    } catch (error) {
      console.error('Error updating receiver:', error);
      let errorMessage = error.message;

      if (error.message.includes('Only owner')) {
        errorMessage = 'Only the platform owner can add receivers.';
      } else if (error.message.includes('Invalid receiver address')) {
        errorMessage = 'Please enter a valid receiver address.';
      } else if (error.message.includes('Receiver does not exist')) {
        errorMessage = 'This receiver address does not exist.';
      }

      alert('Failed to update receiver: ' + errorMessage);

    } finally {
      setLoading(false);
    }

  };



  return (
    <div className="container py-4">
      {!isOwner ? (
        <div className="alert alert-warning">
          Only the contract owner can manage receivers.
        </div>
      ) : (
        <>
          {/* Add New Receiver Form */}
          <div className="card mb-4">
            <div className="card-header">
              <h2 className="mb-0">Add New Receiver</h2>
            </div>
            <div className="card-body">
              <form onSubmit={addReceiver}>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Receiver Address:</label>
                    <input
                      type="text"
                      name="address"
                      value={newReceiver._address}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="0x..."
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Receiver Name:</label>
                    <input
                      type="text"
                      name="name"
                      value={newReceiver._name}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Organization Name"
                      required
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Description:</label>
                    <input
                      type="text"
                      name="description"
                      value={newReceiver._description}
                      onChange={handleInputChange}
                      className="form-control"
                      placeholder="Organization description"
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding Receiver (Gas-Free)...' : 'Add Receiver (Gas-Free)'}
                </button>
              </form>
            </div>
          </div>

          {/* Receivers List */}
          <div className="card">
            <div className="card-header">
              <h2 className="mb-0">Receiver List</h2>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Total Donations</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivers.map(receiver => (
                      <tr key={receiver._address}>
                        <td>{receiver._address}</td>
                        <td>{receiver._name}</td>
                        <td>{receiver._description}</td>
                        <td>{receiver._totalDonationAmount}</td>
                        <td>
                          <span className={`badge ${receiver._isActive ? 'bg-success' : 'bg-danger'}`}>
                            {receiver._isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              disabled={loading}
                              onClick={() => toggleReceiverStatus(receiver._address)}
                              className={`btn btn-sm ${receiver._isActive ? 'btn-warning' : 'btn-success'}`}
                            >
                              {receiver._isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              disabled={loading}
                              onClick={() => deleteReceiver(receiver._address)}
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

export default ReceiverManagement; 