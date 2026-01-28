#!/usr/bin/env node

import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  getAddressFromPrivateKey,
} from '@stacks/transactions';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { config } from 'dotenv';
import { constants } from 'crypto';

config({ path: resolve(process.cwd(), '.env.local') });

const NETWORK_ENV = process.env.STACKS_NETWORK || process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';
const NETWORK = (NETWORK_ENV === 'mainnet' ? 'mainnet' : 'testnet') as 'mainnet' | 'testnet';

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';
// Use a unique name if needed, or stick to standard
const CONTRACT_NAME = 'crowdfunding-v3';
const CONTRACT_PATH = join(process.cwd(), 'contracts', 'crowdfunding.clar');

if (!PRIVATE_KEY) {
  console.error('❌ Error: DEPLOYER_PRIVATE_KEY required');
  process.exit(1);
}

async function deployContract() {
  try {
    console.log('🚀 Starting deployment...');

    // Read contract
    const contractSource = readFileSync(CONTRACT_PATH, 'utf-8').trim();
    console.log(`SOURCE_LOADED: ${contractSource.length} chars`);

    // Address
    // getAddressFromPrivateKey now accepts network string directly
    const deployerAddress = getAddressFromPrivateKey(PRIVATE_KEY, NETWORK);
    console.log(`DEPLOYER: ${deployerAddress}`);

    // Nonce - fetch from API
    console.log('GET_NONCE...');
    const nonceApiUrl = NETWORK === 'mainnet'
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so';
    const nonceResponse = await fetch(`${nonceApiUrl}/extended/v1/address/${deployerAddress}/nonces`);
    const nonceData = await nonceResponse.json();
    const nonce = nonceData.possible_next_nonce || nonceData.last_executed_tx_nonce + 1 || 0;
    console.log(`NONCE: ${nonce}`);

    // Build Tx
    console.log('BUILD_TX...');

    const transaction = await makeContractDeploy({
      contractName: CONTRACT_NAME,
      codeBody: contractSource,
      senderKey: PRIVATE_KEY,
      network: NETWORK,
      postConditionMode: PostConditionMode.Allow,
      fee: 100000, // Pass as number to be safe (6.x compat)
      nonce: nonce,
    });
    console.log(`TX_CREATED: ${transaction.txid()}`);

    // Broadcast
    console.log('BROADCASTING...');

    const serialized = transaction.serialize();
    const apiUrl = NETWORK === 'mainnet'
      ? 'https://api.mainnet.hiro.so/v2/transactions'
      : 'https://api.testnet.hiro.so/v2/transactions';

    console.log(`API_URL: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: serialized,
    });

    const text = await response.text();
    console.log(`STATUS: ${response.status}`);
    console.log(`RESPONSE: ${text}`);

    if (!response.ok) {
      throw new Error(`API Error: ${text}`);
    }

    console.log('✅ SUCCESS!');
    console.log(`Contract: ${deployerAddress}.${CONTRACT_NAME}`);
    console.log(`TxID: ${transaction.txid()}`);

  } catch (e: any) {
    console.error('❌ FAILED:', e);
    process.exit(1);
  }
}

deployContract();
