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

## 📝 License

MIT License - See LICENSE file for details