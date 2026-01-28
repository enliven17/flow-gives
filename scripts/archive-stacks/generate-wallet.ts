#!/usr/bin/env node

/**
 * Generate a new Stacks wallet
 * 
 * Usage:
 *   tsx scripts/generate-wallet.ts
 */

import { 
  makeRandomPrivKey,
  getAddressFromPrivateKey,
} from '@stacks/transactions';

function generateWallet() {
  console.log('🔐 Generating new Stacks wallet...\n');
  
  // Generate random private key
  // makeRandomPrivKey returns a string in newer versions
  const privateKeyString = makeRandomPrivKey();
  
  // Get addresses for both testnet and mainnet
  const testnetAddress = getAddressFromPrivateKey(
    privateKeyString,
    'testnet'
  );
  
  const mainnetAddress = getAddressFromPrivateKey(
    privateKeyString,
    'mainnet'
  );
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ New Wallet Generated!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🔑 Private Key:');
  console.log(`   ${privateKeyString}\n`);
  console.log('📍 Testnet Address:');
  console.log(`   ${testnetAddress}\n`);
  console.log('📍 Mainnet Address:');
  console.log(`   ${mainnetAddress}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 Next Steps:');
  console.log('   1. Copy the private key above');
  console.log('   2. Get testnet STX from faucet:');
  console.log(`      https://explorer.stacks.co/sandbox/faucet?address=${testnetAddress}`);
  console.log('   3. Update .env.local with:');
  console.log(`      DEPLOYER_PRIVATE_KEY=${privateKeyString}`);
  console.log('   4. Wait for STX to arrive (check explorer)');
  console.log('   5. Run: npm run deploy:contract\n');
  
  return {
    privateKey: privateKeyString,
    testnetAddress,
    mainnetAddress,
  };
}

// Run wallet generation
const wallet = generateWallet();
