/**
 * Flow Client Library (FCL) Configuration
 * 
 * This file configures FCL for connecting to Flow blockchain and managing wallet interactions.
 * It sets up the access node, wallet discovery, and contract addresses for the application.
 */

import * as fcl from "@onflow/fcl";

/**
 * Configure FCL with Flow network settings
 * 
 * This function should be called once when the application initializes,
 * typically in the root layout or app component.
 */
export function configureFCL() {
  const accessNode = process.env.NEXT_PUBLIC_FLOW_ACCESS_NODE || "https://rest-testnet.onflow.org";
  const walletDiscovery = process.env.NEXT_PUBLIC_FLOW_WALLET_DISCOVERY || "https://fcl-discovery.onflow.org/testnet/authn";
  const contractAddress = process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS || "0x0ee0a7ac3ca6d12c";
  const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

  console.log('Configuring FCL with:', {
    accessNode,
    walletDiscovery,
    contractAddress,
    hasWalletConnectId: !!walletConnectProjectId,
  });

  fcl.config({
    // Application details shown in wallet connection UI
    "app.detail.title": "FlowGives",
    "app.detail.icon": "https://flowgives.com/logo.png",
    
    // Flow testnet access node for blockchain queries and transactions
    "accessNode.api": accessNode,
    
    // Wallet discovery endpoint for connecting to Flow wallets (Blocto, Lilico, etc.)
    "discovery.wallet": walletDiscovery,
    
    // WalletConnect Project ID (optional but recommended)
    ...(walletConnectProjectId && { "discovery.wallet.method": "POP/RPC", "walletconnect.projectId": walletConnectProjectId }),
    
    // Contract address aliases for easy reference in transactions and scripts
    "0xCrowdfunding": contractAddress,
    
    // Flow token contract addresses (standard Flow contracts)
    "0xFlowToken": "0x7e60df042a9c0868", // Flow token contract on testnet
    "0xFungibleToken": "0x9a0766d93b6608b7", // Fungible token standard on testnet
  });

  console.log('FCL configured successfully');
}

/**
 * Get the current Flow network (testnet or mainnet)
 */
export function getFlowNetwork(): 'testnet' | 'mainnet' {
  return (process.env.NEXT_PUBLIC_FLOW_NETWORK as 'testnet' | 'mainnet') || 'testnet';
}

/**
 * Get the Flow blockchain explorer URL for a transaction
 */
export function getFlowExplorerUrl(txId: string): string {
  const network = getFlowNetwork();
  const baseUrl = network === 'mainnet' 
    ? 'https://flowscan.org/transaction'
    : 'https://testnet.flowscan.org/transaction';
  return `${baseUrl}/${txId}`;
}

/**
 * Get the Flow blockchain explorer URL for an account
 */
export function getFlowAccountUrl(address: string): string {
  const network = getFlowNetwork();
  const baseUrl = network === 'mainnet'
    ? 'https://flowscan.org/account'
    : 'https://testnet.flowscan.org/account';
  return `${baseUrl}/${address}`;
}
