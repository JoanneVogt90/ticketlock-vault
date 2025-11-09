# 🎫 TicketLock Vault

> **Secure, Privacy-Preserving Event Ticket Management with Fully Homomorphic Encryption**

TicketLock Vault is a decentralized application that leverages **FHEVM (Fully Homomorphic Encryption Virtual Machine)** by Zama to create a privacy-first ticket management system. Ticket seat numbers and lock statuses are encrypted on-chain, ensuring that sensitive information remains private while still being verifiable and transferable.

## 🌟 Features

- **🔐 Encrypted Ticket Data**: Seat numbers and lock status are encrypted using FHE, protecting user privacy
- **🎭 Event Management**: Create tickets with event details, venue, and date information
- **🔓 Lock/Unlock Mechanism**: Control ticket visibility with encrypted lock status
- **🔄 Secure Transfers**: Transfer tickets between addresses while maintaining encryption
- **📱 Modern UI**: Beautiful, responsive Next.js frontend with real-time updates
- **⛓️ Blockchain-Powered**: Deployed on Ethereum Sepolia testnet with full decentralization
- **🧪 Comprehensive Testing**: Extensive test coverage including edge cases and integration tests

## 🎬 Demo

### 🌐 Live Demo
**Try it now:** [https://ticketlock-vault.vercel.app/](https://ticketlock-vault.vercel.app/)

### 📹 Video Demonstration
Watch the full demo showcasing ticket creation, encryption, and lock/unlock functionality:

[View Demo Video](./ticketlock-demo.mp4)

## 🏗️ Architecture

### Smart Contract (`TicketVault.sol`)

The core smart contract implements:
- **Encrypted Storage**: Uses `euint32` for seat numbers and `ebool` for lock status
- **Access Control**: Only ticket owners can decrypt and modify their tickets
- **Event Emissions**: Tracks ticket creation, transfers, and lock status changes
- **Input Validation**: Prevents empty fields and invalid operations
- **Gas Optimization**: Efficient storage patterns and minimal SLOAD operations

### Frontend Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS with custom design system
- **Web3 Integration**: wagmi + ethers.js for blockchain interaction
- **FHE Client**: fhevmjs for encryption/decryption operations
- **UI Components**: Custom components with accessibility features

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **MetaMask**: Browser wallet extension
- **Sepolia ETH**: For testnet transactions ([Get from faucet](https://sepoliafaucet.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JoanneVogt90/ticketlock-vault.git
   cd ticketlock-vault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY  # Optional
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

### Deployment

#### Deploy to Sepolia Testnet
```bash
npx hardhat deploy --network sepolia
```

#### Verify Contract
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Frontend Development

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
ticketlock-vault/
├── contracts/
│   └── TicketVault.sol          # Main FHE-encrypted ticket contract
├── deploy/
│   └── deploy.ts                # Deployment script with verification
├── tasks/
│   └── TicketVault.ts           # CLI tasks for contract interaction
├── test/
│   ├── TicketVault.ts           # Unit tests
│   └── TicketVaultSepolia.ts    # Integration tests
├── frontend/
│   ├── app/                     # Next.js app directory
│   ├── components/              # React components
│   │   ├── TicketCard.tsx       # Ticket display component
│   │   └── ...
│   ├── hooks/
│   │   └── useTicketVault.tsx   # Contract interaction hook
│   ├── fhevm/                   # FHE utilities
│   └── abi/                     # Contract ABIs
├── hardhat.config.ts            # Hardhat configuration
└── package.json                 # Dependencies
```

## 🎯 Usage

### Creating a Ticket

```typescript
// Using the frontend hook
const { createTicket } = useTicketVault();

await createTicket(
  "Taylor Swift Concert",  // Event name
  "Madison Square Garden", // Venue
  "2025-06-15",           // Date
  42                      // Seat number (will be encrypted)
);
```

### Decrypting Ticket Data

```typescript
const { decryptTicket } = useTicketVault();

// Decrypt to view seat number and lock status
await decryptTicket(ticketId);
```

### Locking/Unlocking Tickets

```typescript
const { lockTicket, unlockTicket } = useTicketVault();

// Lock ticket (hide QR code)
await lockTicket(ticketId);

// Unlock ticket (show QR code)
await unlockTicket(ticketId);
```

### CLI Tasks

```bash
# Create a ticket
npx hardhat task:create-ticket \
  --event "Concert" \
  --venue "Arena" \
  --date "2025-01-01" \
  --seat 10

# List owner's tickets
npx hardhat task:list-tickets

# Get all tickets summary
npx hardhat task:get-all-tickets

# Decrypt seat number
npx hardhat task:decrypt-seat --id 0

# Lock/unlock ticket
npx hardhat task:lock-ticket --id 0
npx hardhat task:unlock-ticket --id 0
```

## 🧪 Testing

### Run All Tests
```bash
npm run test
```

### Run Sepolia Integration Tests
```bash
npm run test:sepolia
```

### Generate Coverage Report
```bash
npm run coverage
```

### Test Coverage Highlights
- ✅ Input validation for empty fields
- ✅ Reentrancy protection in transfers
- ✅ Access control for owner-only operations
- ✅ Edge cases (zero address, self-transfer, non-existent tickets)
- ✅ FHE encryption/decryption workflows
- ✅ Lock/unlock state transitions

## 🔒 Security Features

1. **Checks-Effects-Interactions Pattern**: Prevents reentrancy attacks
2. **Input Validation**: Rejects empty strings and invalid addresses
3. **Access Control**: Owner-only operations for sensitive functions
4. **FHE Encryption**: Seat numbers never exposed on-chain
5. **Permission Management**: Granular control over encrypted data access

## 🛠️ Available Scripts

| Script                | Description                          |
|-----------------------|--------------------------------------|
| `npm run compile`     | Compile smart contracts              |
| `npm run test`        | Run unit tests                       |
| `npm run test:sepolia`| Run integration tests on Sepolia     |
| `npm run coverage`    | Generate test coverage report        |
| `npm run lint`        | Run linting checks                   |
| `npm run clean`       | Clean build artifacts                |
| `npm run node`        | Start local Hardhat node             |

## 📚 Technology Stack

### Blockchain
- **Solidity**: ^0.8.24
- **FHEVM**: @fhevm/solidity ^0.8.0
- **Hardhat**: 2.21.0
- **Ethers.js**: ^6.15.0

### Frontend
- **Next.js**: 14.x
- **React**: 18.x
- **TypeScript**: ^5.8.3
- **TailwindCSS**: ^3.x
- **wagmi**: For Web3 integration
- **fhevmjs**: For FHE operations

### Testing
- **Chai**: ^4.5.0
- **Mocha**: ^11.7.1
- **Hardhat Network Helpers**: ^1.1.0

## 🌐 Deployment

**Contract Address (Sepolia)**: `0x...` *(Update after deployment)*

**Frontend**: [https://ticketlock-vault.vercel.app/](https://ticketlock-vault.vercel.app/)

**Network**: Ethereum Sepolia Testnet

## 📖 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Protocol Guides](https://docs.zama.ai/protocol/solidity-guides)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama**: For the groundbreaking FHEVM technology
- **Hardhat**: For the excellent development framework
- **Vercel**: For seamless deployment and hosting

---

**Built with 🔐 and ❤️ using FHEVM by Zama**
