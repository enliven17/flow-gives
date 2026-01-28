# Archived Stacks Scripts

This directory contains scripts from the original Stacks blockchain implementation that are no longer used after migrating to Flow blockchain.

## Archived Scripts

### deploy-contract.ts
- **Purpose**: Deployed Clarity smart contracts to Stacks blockchain
- **Replaced by**: Flow CLI commands (`npm run flow:deploy`)
- **Status**: Archived for reference only

### generate-wallet.ts
- **Purpose**: Generated Stacks wallet addresses and private keys
- **Replaced by**: Flow CLI wallet management
- **Status**: Archived for reference only

## Migration Notes

The platform has been migrated from Stacks blockchain to Flow blockchain. These scripts are kept for historical reference but should not be used in the current implementation.

For Flow blockchain deployment and wallet management, use:
- `npm run flow:deploy` - Deploy contracts to Flow testnet
- `npm run flow:deploy:emulator` - Deploy contracts to Flow emulator
- `flow keys generate` - Generate Flow wallet keys (via Flow CLI)

See the main project documentation for current deployment procedures.
