# Smart Contract Deployment Guide

This guide provides step-by-step instructions for deploying the StacksGives crowdfunding smart contract to Stacks testnet.

## Prerequisites

### 1. Install Clarinet

Clarinet is the Clarity smart contract development tool.

**macOS/Linux:**
```bash
curl -L https://github.com/hirosystems/clarinet/releases/download/v1.7.0/clarinet-linux-x64.tar.gz | tar xz
sudo mv clarinet /usr/local/bin/
```

**Windows:**
Download from: https://github.com/hirosystems/clarinet/releases

**Verify installation:**
```bash
clarinet --version
```

### 2. Set Up Stacks Wallet

1. Install Hiro Wallet browser extension: https://wallet.hiro.so/
2. Create a new wallet or import existing one
3. Switch to Testnet network in wallet settings
4. Get testnet STX from faucet: https://explorer.stacks.co/sandbox/faucet

### 3. Configure Environment

Create a `.env` file in the project root:

```env
# Stacks Network Configuration
STACKS_NETWORK=testnet
STACKS_API_URL=https://api.testnet.hiro.so

# Contract Deployment
DEPLOYER_PRIVATE_KEY=your_private_key_here
CONTRACT_NAME=crowdfunding

# USDCx Token Contract (Testnet)
USDCX_CONTRACT_ADDRESS=SP3DX3H4FEYZJZ586MFBS25ZW3HZDMEW92260R2PR.Wrapped-USD
```

**⚠️ Security Warning:** Never commit your private key to version control!

## Local Testing

Before deploying to testnet, test the contract locally:

### 1. Check Contract Syntax

```bash
clarinet check
```

This validates the Clarity syntax and checks for common errors.

### 2. Run Unit Tests

```bash
clarinet test
```

This runs all unit tests defined in the `tests/` directory.

### 3. Interactive Console

```bash
clarinet console
```

This opens an interactive REPL where you can call contract functions:

```clarity
;; Create a project
(contract-call? .crowdfunding create-project 
  u"My Project" 
  u"A great crowdfunding project" 
  u1000000000 
  u1000)

;; Get project details
(contract-call? .crowdfunding get-project u1)

;; Contribute to project
(contract-call? .crowdfunding contribute u1 u100000000)
```

## Testnet Deployment

### Method 1: Using Clarinet (Recommended)

1. **Configure deployment settings:**

Edit `Clarinet.toml` to ensure contract settings are correct.

2. **Deploy to testnet:**

```bash
clarinet deployments generate --testnet
clarinet deployments apply --testnet
```

3. **Verify deployment:**

The deployment will output the contract address. Save this for frontend configuration.

### Method 2: Using Stacks CLI

1. **Install Stacks CLI:**

```bash
npm install -g @stacks/cli
```

2. **Deploy contract:**

```bash
stx deploy_contract \
  contracts/crowdfunding.clar \
  crowdfunding \
  --testnet \
  --private-key $DEPLOYER_PRIVATE_KEY
```

3. **Wait for confirmation:**

The transaction will be broadcast to the network. Wait for confirmation (typically 1-2 blocks, ~10-20 minutes).

### Method 3: Using Hiro Platform

1. Go to https://platform.hiro.so/
2. Connect your wallet
3. Navigate to "Deploy Contract"
4. Upload `contracts/crowdfunding.clar`
5. Set contract name to "crowdfunding"
6. Review and confirm deployment transaction
7. Wait for confirmation

## Post-Deployment

### 1. Verify Contract on Explorer

Visit the Stacks Explorer:
```
https://explorer.stacks.co/txid/[YOUR_TX_ID]?chain=testnet
```

Check that:
- Transaction is confirmed
- Contract is deployed successfully
- Contract address is visible

### 2. Update Frontend Configuration

Update the contract configuration in your frontend:

**File: `lib/contracts/crowdfunding.types.ts`**

```typescript
export const DEFAULT_CONTRACT_CONFIG: ContractConfig = {
  contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Your deployed address
  contractName: 'crowdfunding',
  network: 'testnet',
};
```

**File: `.env.local`**

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.crowdfunding
NEXT_PUBLIC_STACKS_NETWORK=testnet
```

### 3. Test Contract Functions

Use the Stacks Explorer or your frontend to test:

1. **Create a test project:**
   - Call `create-project` with test data
   - Verify project is created and ID is returned

2. **Make a test contribution:**
   - Call `contribute` with project ID and amount
   - Verify contribution is recorded

3. **Test read functions:**
   - Call `get-project` to retrieve project data
   - Call `get-contribution` to retrieve contribution data
   - Call `is-project-active` to check project status

### 4. Document Deployment

Create a deployment record:

**File: `contracts/DEPLOYMENT_RECORD.md`**

```markdown
# Deployment Record

## Testnet Deployment

- **Date:** [Deployment Date]
- **Network:** Stacks Testnet
- **Contract Address:** [Your Contract Address]
- **Contract Name:** crowdfunding
- **Deployer Address:** [Your Wallet Address]
- **Transaction ID:** [Deployment TX ID]
- **Block Height:** [Deployment Block]

## Contract Details

- **Clarity Version:** 2
- **Epoch:** 2.4
- **Source Code Hash:** [Git commit hash]

## Verification

- Explorer Link: https://explorer.stacks.co/txid/[TX_ID]?chain=testnet
- Contract Link: https://explorer.stacks.co/address/[CONTRACT_ADDRESS]?chain=testnet

## Notes

[Any deployment notes or issues encountered]
```

## Troubleshooting

### Common Issues

**1. "Insufficient balance" error:**
- Ensure your wallet has enough STX for deployment fees
- Get more testnet STX from the faucet

**2. "Contract already exists" error:**
- Contract names must be unique per address
- Use a different contract name or deploy from a different address

**3. "Invalid Clarity syntax" error:**
- Run `clarinet check` to identify syntax errors
- Fix errors and redeploy

**4. Transaction stuck in pending:**
- Testnet can be slow during high usage
- Wait up to 30 minutes for confirmation
- Check transaction status on explorer

### Getting Help

- Stacks Discord: https://discord.gg/stacks
- Clarity Documentation: https://docs.stacks.co/clarity
- Clarinet Documentation: https://github.com/hirosystems/clarinet

## Mainnet Deployment

**⚠️ Important:** Do not deploy to mainnet until:

1. All unit tests pass
2. Property-based tests pass
3. Contract has been audited by security professionals
4. Extensive testing on testnet is complete
5. Team has reviewed and approved deployment

Mainnet deployment follows the same process but:
- Use `--mainnet` flag instead of `--testnet`
- Ensure sufficient STX for deployment fees (mainnet fees are real)
- Double-check all contract code
- Have a rollback plan ready

## Next Steps

After successful deployment:

1. Complete task 2.2: Write unit tests for contract functions
2. Complete task 2.3: Write property tests for contract invariants
3. Integrate contract with frontend services (task 6.1)
4. Test end-to-end flows with real wallet and testnet STX
5. Document any issues or improvements needed
