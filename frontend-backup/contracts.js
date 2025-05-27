// Contract Addresses (Hardhat localhost network)
const CONTRACT_ADDRESSES = {
    FORWARDER: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    DONATION_PLATFORM: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    TEST_TOKEN: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
};

// Network Configuration
const HARDHAT_NETWORK = {
    chainId: "0x7A69", // 31337 in hex
    chainName: "Hardhat Localhost",
    rpcUrls: ["http://127.0.0.1:8545"],
    nativeCurrency: {
        name: "ETH",
        symbol: "ETH",
        decimals: 18
    }
};

// ERC20 Token ABI (minimal, sadece ihtiyacımız olan fonksiyonlar)
const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// ERC2771Forwarder ABI
const FORWARDER_ABI = [
    "function getNonce(address from) view returns (uint256)",
    "function verify(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) view returns (bool)",
    "function execute(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) payable returns (bool, bytes)"
];

// DonationPlatform ABI
const DONATION_PLATFORM_ABI = [
    // View functions
    "function owner() view returns (address)",
    "function trustedForwarder() view returns (address)",
    "function isTrustedForwarder(address forwarder) view returns (bool)",
    
    // Donation functions
    "function donate(address receiver, address token, uint256 amount, string memory message) external",
    "function getDonationHistory(address user) view returns (tuple(address receiver, address token, uint256 amount, string message, uint256 timestamp)[])",
    "function getTotalDonationsReceived(address receiver) view returns (uint256)",
    "function getTotalDonationsGiven(address donor) view returns (uint256)",
    
    // Token management
    "function addAllowedToken(address token, string memory name) external",
    "function removeAllowedToken(address token) external",
    "function getAllowedTokens() view returns (tuple(address tokenAddress, string name, bool isActive)[])",
    "function isTokenAllowed(address token) view returns (bool)",
    
    // Receiver management  
    "function addReceiver(address receiver, string memory name) external",
    "function removeReceiver(address receiver) external",
    "function getReceivers() view returns (tuple(address receiverAddress, string name, bool isActive)[])",
    "function isReceiverActive(address receiver) view returns (bool)",
    
    // Events
    "event DonationMade(address indexed donor, address indexed receiver, address indexed token, uint256 amount, string message, uint256 timestamp)",
    "event TokenAdded(address indexed token, string name)",
    "event TokenRemoved(address indexed token)",
    "event ReceiverAdded(address indexed receiver, string name)",
    "event ReceiverRemoved(address indexed receiver)"
];

// EIP-712 Domain for meta-transactions
const EIP712_DOMAIN = {
    name: "DonationPlatformForwarder",
    version: "1",
    chainId: 31337, // Hardhat localhost chain ID
    verifyingContract: CONTRACT_ADDRESSES.FORWARDER
};

// ForwardRequest type for EIP-712
const FORWARD_REQUEST_TYPE = {
    ForwardRequest: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "gas", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "data", type: "bytes" }
    ]
};

// Utility functions
const UTILS = {
    // Convert Wei to Ether with proper formatting
    formatEther: (wei) => {
        if (typeof ethers !== 'undefined' && ethers.utils) {
            return ethers.utils.formatEther(wei);
        }
        // Fallback for when ethers is not loaded
        return (parseFloat(wei) / Math.pow(10, 18)).toFixed(4);
    },
    
    // Convert Ether to Wei
    parseEther: (ether) => {
        if (typeof ethers !== 'undefined' && ethers.utils) {
            return ethers.utils.parseEther(ether.toString());
        }
        // Fallback for when ethers is not loaded
        return (parseFloat(ether) * Math.pow(10, 18)).toString();
    },
    
    // Format address to show first 6 and last 4 characters
    formatAddress: (address) => {
        if (!address) return "";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },
    
    // Format timestamp to readable date
    formatTimestamp: (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('tr-TR');
    },
    
    // Show success message
    showSuccess: (message) => {
        console.log("✅ Success:", message);
        return `<div class="success"><i class="fas fa-check-circle"></i> ${message}</div>`;
    },
    
    // Show error message  
    showError: (message) => {
        console.error("❌ Error:", message);
        return `<div class="error"><i class="fas fa-times-circle"></i> ${message}</div>`;
    },
    
    // Show warning message
    showWarning: (message) => {
        console.warn("⚠️ Warning:", message);
        return `<div class="warning"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
    }
};

// Export all constants and utilities
window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
window.HARDHAT_NETWORK = HARDHAT_NETWORK;
window.ERC20_ABI = ERC20_ABI;
window.FORWARDER_ABI = FORWARDER_ABI;
window.DONATION_PLATFORM_ABI = DONATION_PLATFORM_ABI;
window.EIP712_DOMAIN = EIP712_DOMAIN;
window.FORWARD_REQUEST_TYPE = FORWARD_REQUEST_TYPE;
window.UTILS = UTILS; 