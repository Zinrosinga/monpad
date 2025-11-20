# 🚀 MonPad

> **Smart Account Token Launchpad** - Deploy, mint, and transfer tokens with ERC-4337 Smart Accounts

---

## 🎯 Features

- 🔐 **Smart Account Integration** - MetaMask Smart Accounts with ERC-4337
- 🪙 **Token Factory** - Deploy custom ERC-20 tokens
- 💰 **Token Operations** - Mint and transfer tokens via Smart Account
- 📊 **Multi-Chain Support** - Sepolia & Monad Testnet
- 🔔 **Event Tracking** - MonPad contract for Envio indexing
- 🎨 **Modern UI** - Clean interface with toast notifications

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Wallet**: MetaMask Smart Accounts, Wagmi
- **Blockchain**: Ethereum Sepolia, Monad Testnet
- **Bundler**: Pimlico (ERC-4337)
- **Notifications**: React Hot Toast

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Testnet tokens (Sepolia ETH, Monad MON)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Deploy Contracts
```bash
cd ../contracts
npm install
npx hardhat deploy --network sepolia
npx hardhat deploy --network monad
```

---

## 📖 Usage

1. **Connect Wallet** - Connect MetaMask to supported network
2. **Create Smart Account** - Initialize counterfactual address
3. **Deploy Smart Account** - Deploy to blockchain
4. **Deploy Token** - Create custom ERC-20 token
5. **Mint Tokens** - Mint tokens to Smart Account
6. **Transfer Tokens** - Send tokens to other addresses

---

## 🌐 Networks

| Network | Chain ID | Status | Bundler |
|---------|----------|--------|---------|
| Sepolia | 11155111 | ✅ Active | Pimlico |
| Monad | 10143 | ✅ Active | Pimlico |

---

## 📁 Project Structure

```
monpad/
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── config/        # Wagmi & Smart Account config
│   │   ├── abi/          # Contract ABIs
│   │   └── lib/          # Utilities
├── contracts/         # Hardhat contracts
│   ├── contracts/        # Solidity contracts
│   ├── scripts/          # Deployment scripts
│   └── deployments/      # Contract addresses
```

---

## 🔧 Development

```bash
# Frontend development
npm run dev

# Build for production
npm run build

# Contract deployment
npx hardhat deploy --network [network]

# Generate ABIs
npm run genabi
```

---

## 🔍 Envio Integration

MonPad integrates with **Envio HyperIndex** for comprehensive blockchain data indexing and analytics:

### 📊 Indexed Events
- **TokenDeployed** - Track all token deployments with metadata
- **TokenMinted** - Monitor token minting activities  
- **TokenTransferred** - Record all token transfers between accounts

### 🔗 MonPad Contract Functions
```solidity
// Core indexing functions
recordDeploy(address token, string name, string symbol, uint256 supply)
recordMint(address token, address to, uint256 amount)  
recordTransfer(address token, address to, uint256 amount)
```

### 📈 Query Capabilities
- **Token Analytics** - Deployment trends, mint volumes, transfer patterns
- **User Activity** - Smart Account usage, token interactions
- **Multi-Chain Data** - Cross-chain token operations (Sepolia + Monad)
- **Real-time Events** - Live monitoring of token lifecycle events

### 🔍 GraphQL Examples
```graphql
# Get latest token deployments
query {
  MonPad_TokenDeployed(limit: 5, order_by: { timestamp: desc }) {
    deployer
    tokenAddress
    name
    symbol
    supply
    timestamp
  }
}

# Get recent token mints
query {
  MonPad_TokenMinted(limit: 5, order_by: { timestamp: desc }) {
    caller
    tokenAddress
    to
    amount
    timestamp
  }
}

# Get token transfers
query {
  MonPad_TokenTransferred(limit: 5, order_by: { timestamp: desc }) {
    caller
    tokenAddress
    to
    amount
    timestamp
  }
}

# Get smart account deployments
query {
  MonPad_AccountDeployed(limit: 5, order_by: { timestamp: desc }) {
    user
    smartAccount
    timestamp
  }
}
```

**Endpoint**: `https://indexer.dev.hyperindex.xyz/e43f549/v1/graphql`

### 🎯 Envio Benefits
- **Decentralized Indexing** - Reliable blockchain data without centralized APIs
- **Multi-Chain Support** - Unified data across Ethereum and Monad networks  
- **Event Tracking** - Complete audit trail of all token operations
- **Analytics Ready** - Structured data for dashboards and insights

---
Thank you!

## 📝 License

MIT License - See LICENSE file for details