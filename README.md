# Gasless Donation Platform

A decentralized donation platform built with Solidity and React, featuring gasless transactions, permit approvals, and real-time donation tracking.

## 🌟 Features

- **Gasless Donations**: Users can make donations without paying gas fees
- **Permit Approvals**: Gasless token approvals using EIP-2612 permit
- **Donation History**: Track all donations
- **Token Management**: Add, remove, and manage supported tokens
- **Receiver Management**: Manage donation receivers with detailed statistics
- **Owner Dashboard**: Secure management interface for platform owners
- **Responsive Design**: Modern UI with Bootstrap components

## 🛠️ Tech Stack

### Smart Contracts
- Solidity ^0.8.20
- OpenZeppelin Contracts ^5.3.0
- Hardhat ^2.22.0

### Frontend
- React ^18.3.1
- Ethers.js ^6.13.4
- React Router DOM ^6.30.1
- Bootstrap 5
- Font Awesome ^6.6.0

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/solidity-donation-app.git
cd solidity-donation-app
```

2. Install dependencies:
```bash
npm install
```

3. Start local blockchain:
```bash
npm run node
```

4. Deploy contracts:
```bash
npm run deploy
```

5. Start frontend:
```bash
npm start
```

## 🚀 Usage

### Making a Donation
1. Connect your wallet
2. Select a token
3. Choose a receiver
4. Enter donation amount
5. Approve tokens (gasless using permit)
6. Click "Donate (Gas-Free)"

NOTE : ONLY OWNER CAN SEE NAVBAR

### Managing Tokens (Owner Only)
1. Navigate to Token Management
2. Add new tokens with address, name, and symbol
3. Activate/deactivate tokens
4. Remove tokens if needed

### Managing Receivers (Owner Only)
1. Navigate to Receiver Management
2. Add new receivers with address, name, and description
3. Activate/deactivate receivers
4. Remove receivers if needed

## Features in Detail

### Gasless Transactions
- Uses EIP-2771 for gasless transactions
- Relayer handles gas fees
- Secure signature verification

### Permit Approvals
- EIP-2612 compliant permit approvals
- Gasless token approvals
- Secure signature-based permissions

### Pre-configured Setup
The platform comes with pre-configured test environment:
- Test Token (DONATE): 10,000 tokens minted to each account
- Sample Receivers:
  - Children's Education Foundation
  - Additional receiver slots available
- Role-based accounts:
  - Owner (Platform Admin)
  - Relayer (Gas Payer)
  - User (Token Holder)
  - Receiver accounts

### Donation History
- Real-time updates
- Pagination support
- Detailed transaction information
- Token and receiver details

### Owner Features
- Token management
- Receiver management
- Platform statistics
- Activity controls

## 🧪 Testing

Run tests with:
```bash
npx hardhat test
```
![homedp](https://github.com/user-attachments/assets/b0b36524-052e-42a3-b1f6-54da5b53355a)
![receiverdp](https://github.com/user-attachments/assets/604cf6cb-4710-4f7e-a945-622509fa2a4f)
![tokenmanagerdp](https://github.com/user-attachments/assets/75e218f3-41ef-4705-a3e4-6813f24182da)
