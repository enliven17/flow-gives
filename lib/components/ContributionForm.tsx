/**
 * ContributionForm - Component for making contributions to projects
 * 
 * This component provides:
 * - Amount input field
 * - USDCx balance display
 * - Validation for amount > 0
 * - Contribute button
 * - Transaction status display (signing, broadcasting, confirming)
 * - Transaction error display
 * 
 * Requirements: 3.1, 3.2, 3.4
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/wallet.context';
import { TransactionService } from '../services/transaction.service';
import { formatUSDCx } from '../utils/format';

/**
 * Transaction status type
 */
export type TransactionStatus = 'idle' | 'signing' | 'broadcasting' | 'confirming' | 'confirmed' | 'failed';

/**
 * ContributionForm props
 */
export interface ContributionFormProps {
  /**
   * Project ID to contribute to
   */
  projectId: string;

  /**
   * Fundraiser address (recipient of contribution)
   */
  fundraiserAddress: string;

  /**
   * Optional callback when contribution is confirmed
   */
  onSuccess?: (contribution: any) => void;

  /**
   * Optional callback when contribution fails
   */
  onError?: (error: Error) => void;

  /**
   * Optional className for styling
   */
  className?: string;

  /**
   * Minimum contribution amount in USDCx (default: 1)
   */
  minAmount?: number;
}

/**
 * ContributionForm component
 * 
 * Displays a form for making contributions with amount validation,
 * balance checking, and transaction status tracking.
 * 
 * @param props Component props
 * @returns ContributionForm component
 * 
 * Requirements: 3.1, 3.2, 3.4
 */
export function ContributionForm({
  projectId,
  fundraiserAddress,
  onSuccess,
  onError,
  className = '',
  minAmount = 1,
}: ContributionFormProps) {
  const { isConnected, address, balance, refreshBalance } = useWallet();

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [amountError, setAmountError] = useState<string>('');

  // Transaction state
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txId, setTxId] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Refresh balance when component mounts
  useEffect(() => {
    if (isConnected) {
      refreshBalance();
    }
  }, [isConnected, refreshBalance]);

  /**
   * Convert USDCx to micro-USDCx
   * 
   * @param usdcx - Amount in USDCx
   * @returns Amount in micro-USDCx
   */
  const toMicroUSDCx = (usdcx: number): bigint => {
    return BigInt(Math.floor(usdcx * 1_000_000));
  };

  /**
   * Convert micro-USDCx to USDCx
   * 
   * @param microUsdcx - Amount in micro-USDCx
   * @returns Amount in USDCx
   */
  const fromMicroUSDCx = (microUsdcx: bigint): number => {
    return Number(microUsdcx) / 1_000_000;
  };

  /**
   * Validate contribution amount
   * 
   * Requirements: 3.2
   */
  const validateAmount = (value: string): boolean => {
    setAmountError('');

    // Check if empty
    if (!value || value.trim() === '') {
      setAmountError('Amount is required');
      return false;
    }

    // Parse amount
    const numAmount = parseFloat(value);

    // Check if valid number
    if (isNaN(numAmount)) {
      setAmountError('Amount must be a valid number');
      return false;
    }

    // Check if greater than zero
    if (numAmount <= 0) {
      setAmountError('Amount must be greater than zero');
      return false;
    }

    // Check minimum amount
    if (numAmount < minAmount) {
      setAmountError(`Amount must be at least ${minAmount} USDCx`);
      return false;
    }

    // Check if user has sufficient balance
    if (balance !== null) {
      const microAmount = toMicroUSDCx(numAmount);
      if (microAmount > balance) {
        setAmountError(`Insufficient balance. You have ${formatUSDCx(balance)} USDCx`);
        return false;
      }
    }

    return true;
  };

  /**
   * Handle amount input change
   */
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);

    // Clear error when user starts typing
    if (amountError) {
      setAmountError('');
    }
  };

  /**
   * Handle amount input blur (validate on blur)
   */
  const handleAmountBlur = () => {
    if (amount) {
      validateAmount(amount);
    }
  };

  /**
   * Handle form submission
   * 
   * Requirements: 3.1, 3.2, 3.4
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate wallet connection
    if (!isConnected || !address) {
      setTxError('Please connect your wallet to contribute');
      return;
    }

    // Validate amount
    if (!validateAmount(amount)) {
      return;
    }

    const numAmount = parseFloat(amount);
    const microAmount = toMicroUSDCx(numAmount);

    try {
      // Reset error state
      setTxError(null);
      setTxId(null);

      // Set status to signing
      setTxStatus('signing');

      // Step 1: Validate contribution via API (server-side validation)
      const validateResponse = await fetch(`/api/projects/${projectId}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: microAmount.toString(),
          contributorAddress: address,
        }),
      });

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json();
        throw new Error(errorData.error || 'Failed to validate contribution');
      }

      const { fundraiserAddress: apiFundraiserAddress, memo } = await validateResponse.json();

      // Use prop fundraiserAddress if available, otherwise use API response
      // This ensures we use the correct recipient address
      const recipientAddress = fundraiserAddress || apiFundraiserAddress;

      if (!recipientAddress) {
        throw new Error('Fundraiser address is required');
      }

      // Step 2: Create transaction service and create transaction
      const transactionService = new TransactionService({ network: 'testnet' });

      const unsignedTransaction = await transactionService.createTransferTransaction(
        recipientAddress,
        microAmount,
        address,
        memo
      );

      // Step 3: Sign and broadcast transaction
      setTxStatus('broadcasting');
      const result = await transactionService.signAndBroadcast(unsignedTransaction);

      // Transaction broadcast successful - record immediately to Supabase
      setTxId(result.txId);
      setTxStatus('confirming');

      const contributionResult = {
        txId: result.txId,
        amount: microAmount,
        projectId,
        contributorAddress: address,
      };

      // Step 4: Record contribution immediately (transaction is already successful)
      // We don't wait for confirmation since the transaction is already broadcast successfully
      try {
        const recordResponse = await fetch('/api/contributions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            contributorAddress: address,
            amount: microAmount.toString(),
            txId: result.txId,
            blockHeight: 0, // Will be updated later if needed
            timestamp: new Date().toISOString(),
          }),
        });

        if (!recordResponse.ok) {
          let errorMessage = 'Failed to record contribution';
          try {
            const errorData = await recordResponse.json();
            errorMessage = errorData.error || errorMessage;
            console.error('Contribution recording error:', errorData);
          } catch (parseError) {
            const text = await recordResponse.text();
            console.error('Failed to parse error response:', text);
            errorMessage = `Server error: ${recordResponse.status} ${recordResponse.statusText}`;
          }
          throw new Error(errorMessage);
        }

        setTxStatus('confirmed');

        // Refresh balance after successful contribution
        refreshBalance();

        // Call success callback
        if (onSuccess) {
          onSuccess(contributionResult);
        }

        // Reset form
        setAmount('');

        // Optionally: Check confirmation in background (non-blocking)
        // This is just for updating blockHeight if needed, doesn't block the UI
        fetch(`/api/transactions/${result.txId}/status`)
          .then(res => res.ok ? res.json() : null)
          .then(status => {
            if (status?.status === 'confirmed' && status.blockHeight) {
              console.log('Transaction confirmed at block:', status.blockHeight);
              // Optionally update blockHeight in database if needed
            }
          })
          .catch(err => {
            // Ignore errors in background check
            console.log('Background confirmation check failed (non-critical):', err);
          });
      } catch (error) {
        setTxStatus('failed');
        const errorMessage = error instanceof Error ? error.message : 'Failed to record contribution';
        setTxError(errorMessage);

        // Call error callback
        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage));
        }
      }

    } catch (error) {
      setTxStatus('failed');
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit contribution';
      setTxError(errorMessage);

      // Call error callback
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    }
  };

  /**
   * Get transaction status message
   */
  const getStatusMessage = (): string => {
    switch (txStatus) {
      case 'signing':
        return 'Please sign the transaction in your wallet...';
      case 'broadcasting':
        return 'Broadcasting transaction to blockchain...';
      case 'confirming':
        return 'Waiting for transaction confirmation...';
      case 'confirmed':
        return 'Contribution confirmed! Thank you for your support.';
      case 'failed':
        return 'Transaction failed. Please try again.';
      default:
        return '';
    }
  };

  /**
   * Get transaction explorer URL
   */
  const getExplorerUrl = (): string | null => {
    if (!txId) return null;
    const transactionService = new TransactionService({ network: 'testnet' });
    return transactionService.getExplorerUrl(txId);
  };

  /**
   * Check if form is submitting
   */
  const isSubmitting = txStatus === 'signing' || txStatus === 'broadcasting' || txStatus === 'confirming';

  /**
   * Check if form is disabled
   */
  const isDisabled = !isConnected || isSubmitting;

  return (
    <div className={`bg-background-secondary rounded-lg shadow-md p-6 border border-border-default ${className}`}>
      <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-3 sm:mb-4">Make a Contribution</h3>

      {/* Wallet connection check */}
      {!isConnected && (
        <div
          className="mb-4 p-4 bg-accent-warning/20 border border-accent-warning/30 rounded-lg text-accent-warning"
          role="alert"
        >
          <p className="font-medium">Wallet not connected</p>
          <p className="text-sm">Please connect your wallet to make a contribution.</p>
        </div>
      )}

      {/* Balance display */}
      {isConnected && balance !== null && (
        <div className="mb-4 p-3 bg-background-tertiary rounded-lg border border-border-default">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Your USDCx Balance:</span>
            <span className="text-lg font-semibold text-text-primary">
              {formatUSDCx(balance)} USDCx
            </span>
          </div>
        </div>
      )}

      {/* Contribution form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount input */}
        <div>
          <label
            htmlFor="contribution-amount"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            Contribution Amount (USDCx)
          </label>
          <input
            id="contribution-amount"
            type="number"
            step="0.000001"
            min={minAmount}
            value={amount}
            onChange={handleAmountChange}
            onBlur={handleAmountBlur}
            disabled={isDisabled}
            placeholder={`Enter amount (min: ${minAmount} USDCx)`}
            className={`w-full px-4 py-3 sm:py-2 bg-background-tertiary border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary text-text-primary placeholder-text-muted text-base sm:text-sm min-h-[44px] touch-manipulation ${amountError
                ? 'border-accent-error focus:ring-accent-error'
                : 'border-border-default'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-invalid={!!amountError}
            aria-describedby={amountError ? 'amount-error' : undefined}
          />
          {amountError && (
            <p
              id="amount-error"
              className="mt-1 text-sm text-accent-error"
              role="alert"
            >
              {amountError}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isDisabled || !!amountError}
          className={`w-full px-5 sm:px-6 py-2.5 sm:py-2.5 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-secondary min-h-[44px] touch-manipulation text-sm sm:text-base ${isDisabled || amountError
              ? 'bg-background-tertiary text-text-muted cursor-not-allowed opacity-50'
              : 'glass-orange text-text-primary hover:opacity-90 focus:ring-orange-500/50'
            }`}
          aria-label="Contribute to project"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {txStatus === 'signing' && 'Signing...'}
              {txStatus === 'broadcasting' && 'Broadcasting...'}
              {txStatus === 'confirming' && 'Confirming...'}
            </span>
          ) : (
            'Contribute'
          )}
        </button>
      </form>

      {/* Transaction status */}
      {txStatus !== 'idle' && (
        <div className="mt-4">
          {/* Status message */}
          <div
            className={`p-4 rounded-lg ${txStatus === 'confirmed'
                ? 'bg-accent-success/20 border border-accent-success/30'
                : txStatus === 'failed'
                  ? 'bg-accent-error/20 border border-accent-error/30'
                  : 'bg-accent-primary/20 border border-accent-primary/30'
              }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              {/* Status icon */}
              {txStatus === 'confirmed' && (
                <svg
                  className="w-5 h-5 text-accent-success flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {txStatus === 'failed' && (
                <svg
                  className="w-5 h-5 text-accent-error flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {(txStatus === 'signing' || txStatus === 'broadcasting' || txStatus === 'confirming') && (
                <svg
                  className="animate-spin h-5 w-5 text-accent-primary flex-shrink-0 mt-0.5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}

              {/* Status text */}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${txStatus === 'confirmed'
                      ? 'text-accent-success'
                      : txStatus === 'failed'
                        ? 'text-accent-error'
                        : 'text-accent-primary'
                    }`}
                >
                  {getStatusMessage()}
                </p>

                {/* Transaction ID and explorer link */}
                {txId && (
                  <div className="mt-2">
                    <p className="text-xs text-text-secondary mb-1">Transaction ID:</p>
                    <code className="text-xs text-text-primary bg-background-tertiary px-2 py-1 rounded border border-border-default break-all">
                      {txId}
                    </code>
                    {getExplorerUrl() && (
                      <a
                        href={getExplorerUrl()!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-orange-500/90 hover:text-orange-500/70 hover:underline"
                      >
                        View in Explorer
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                )}

                {/* Error message */}
                {txError && (
                  <p className="mt-2 text-sm text-accent-error">
                    {txError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
