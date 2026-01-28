/**
 * ContributionForm - Component for making contributions to projects
 * 
 * Uses Flow blockchain smart contract to make contributions
 */

'use client';

import React, { useState } from 'react';
import { useWallet } from '../contexts/wallet.context';
import { ContractService } from '../services/contract.service';

export interface ContributionFormProps {
  projectId: string;
  contractId: number; // Smart contract project ID (UInt64)
  fundraiserAddress: string;
  onSuccess?: () => void;
}

export function ContributionForm({
  projectId,
  contractId,
  fundraiserAddress,
  onSuccess,
}: ContributionFormProps) {
  const { isConnected, address } = useWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Convert FLOW to UFix64 format (with 8 decimals)
      // UFix64 requires format like "1.00000000"
      const flowAmount = parseFloat(amount);
      const ufix64Amount = flowAmount.toFixed(8); // Always 8 decimals

      console.log('Contributing:', { 
        projectId, 
        contractId, 
        amount: ufix64Amount 
      });

      // Call smart contract with contract_id (UInt64)
      const contractService = new ContractService();
      const txId = await contractService.contribute({
        projectId: contractId.toString(), // Use contract_id for smart contract
        amount: ufix64Amount,
      });

      console.log('Contribution transaction:', txId);

      // Convert to micro-FLOW for database (integer representation)
      const microAmount = Math.floor(flowAmount * 100_000_000).toString();

      // Record contribution in database
      await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          contributorAddress: address,
          amount: microAmount,
          txId,
          blockHeight: 0,
        }),
      });

      setSuccess(true);
      setAmount('');
      
      if (onSuccess) {
        onSuccess();
      }

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);

    } catch (err) {
      console.error('Contribution error:', err);
      setError(err instanceof Error ? err.message : 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-background-tertiary/50 rounded-lg p-6 border border-border-default text-center">
        <svg className="w-12 h-12 mx-auto mb-4 text-accent-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-text-secondary">
          Please connect your wallet to contribute to this project
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Amount Input */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-text-primary mb-2">
          Contribution Amount (FLOW)
        </label>
        <div className="relative">
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            disabled={loading}
            className="w-full px-4 py-3 bg-background-tertiary border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent disabled:opacity-50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary font-medium">
            FLOW
          </div>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Minimum: 0.01 FLOW
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-accent-error/10 border border-accent-error/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-accent-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-accent-error">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-accent-success/10 border border-accent-success/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-accent-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-accent-success">Contribution successful!</p>
              <p className="text-xs text-text-secondary mt-1">Thank you for supporting this project</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !amount || parseFloat(amount) <= 0}
        className="w-full px-6 py-3 bg-accent-primary hover:bg-accent-primary/90 disabled:bg-text-muted disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Contribute</span>
          </>
        )}
      </button>

      <p className="text-xs text-text-muted text-center">
        Your contribution will be processed through the Flow blockchain smart contract
      </p>
    </form>
  );
}
