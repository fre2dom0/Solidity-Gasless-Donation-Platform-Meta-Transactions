import { ethers } from 'ethers';
import { DONATION_PLATFORM, ERC2771_FORWARDER , RELAYER_PRIVATE_KEY} from '../contracts';


  // Helper function to create permit signature for ERC20Permit tokens
export  const createPermitSignature = async (userSigner, token, amount, spender) => {
  try {
    // Get token details for permit domain
    const tokenName = await token.name();
    const tokenNonce = await token.nonces(await userSigner.getAddress());
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    
    // EIP-712 domain for permit
    const permitDomain = {
      name: tokenName,
      version: "1",
      chainId: 31337, // Hardhat localhost
      verifyingContract: await token.getAddress()
    };

    // Permit types
    const permitTypes = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    };

    // Permit message
    const permitMessage = {
      owner: await userSigner.getAddress(),
      spender: spender,
      value: amount,
      nonce: tokenNonce,
      deadline: deadline
    };

    // Sign permit
    const signature = await userSigner.signTypedData(permitDomain, permitTypes, permitMessage);
    const { v, r, s } = ethers.Signature.from(signature);

    return {
      deadline,
      v,
      r,
      s
    };
  } catch (error) {
    console.error('Error creating permit signature:', error);
    throw new Error('Failed to create permit signature. Make sure the token supports ERC20Permit.');
  }
};

// General helper function to create forward request signature
export const createForwardRequestSignature = async (userSigner, forwardRequest) => {
  // EIP-712 domain for forwarder
  const forwarderDomain = {
    name: "DonationPlatformForwarder",
    version: "1",
    chainId: 31337,
    verifyingContract: ERC2771_FORWARDER.ADDRESS
  };

  // ForwardRequest types
  const forwardTypes = {
    ForwardRequest: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "gas", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint48" },
      { name: "data", type: "bytes" }
    ]
  };

  // Sign meta-transaction
  return await userSigner.signTypedData(forwarderDomain, forwardTypes, forwardRequest);
};

// General helper function to create gasless transaction request
export const createGaslessRequest = async (userSigner, provider, functionName, functionArgs, estimatedGas = 300000) => {
  try {
    // Create contract instances
    const donationPlatform = new ethers.Contract(
      DONATION_PLATFORM.ADDRESS,
      DONATION_PLATFORM.ABI,
      provider
    );
    const forwarder = new ethers.Contract(
      ERC2771_FORWARDER.ADDRESS,
      ERC2771_FORWARDER.ABI,
      provider
    );

    // Get user address
    const userAddress = await userSigner.getAddress();
    
    // Encode the function call
    const functionData = donationPlatform.interface.encodeFunctionData(
      functionName,
      functionArgs
    );

    // Get nonce for the user
    const nonce = await forwarder.nonces(userAddress);
    
    // Create deadline (1 hour from now)
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    // Create the forward request
    const forwardRequest = {
      from: userAddress,
      to: DONATION_PLATFORM.ADDRESS,
      value: 0,
      gas: estimatedGas,
      nonce: nonce,
      deadline: deadline,
      data: functionData
    };

    return forwardRequest;
  } catch (error) {
    console.error('Error creating gasless request:', error);
    throw error;
  }
};

// General helper function to execute gasless transaction
export const executeGaslessTransaction = async (forwardRequest, signature, provider) => {
  try {

    const relayerPrivateKey = RELAYER_PRIVATE_KEY;
    const relayerSigner = new ethers.Wallet(relayerPrivateKey, provider);

    // Execute via relayer
    const forwarder = new ethers.Contract(
      ERC2771_FORWARDER.ADDRESS,
      ERC2771_FORWARDER.ABI,
      relayerSigner
    );

    // Create ForwardRequestData structure that includes signature
    const forwardRequestData = {
      from: forwardRequest.from,
      to: forwardRequest.to,
      value: forwardRequest.value,
      gas: forwardRequest.gas,
      deadline: forwardRequest.deadline,
      data: forwardRequest.data,
      signature: signature
    };

    console.log('Executing gasless transaction via relayer...');
    const tx = await forwarder.execute(forwardRequestData);
    const receipt = await tx.wait();

    console.log('Gasless transaction completed!', receipt);
    return receipt;
  } catch (error) {
    console.error('Error executing gasless transaction:', error);
    throw error;
  }
};
