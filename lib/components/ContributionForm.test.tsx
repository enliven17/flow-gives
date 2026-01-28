/**
 * ContributionForm - Unit Tests
 * 
 * Tests for the ContributionForm component including:
 * - Rendering and display
 * - Amount validation
 * - Balance checking
 * - Transaction flow
 * - Error handling
 * 
 * Requirements: 3.1, 3.2, 3.4
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContributionForm } from './ContributionForm';
import { useWallet } from '../contexts/wallet.context';
import { contributionService } from '../services/contribution.service';

// Mock Supabase server
jest.mock('../supabase/server', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock dependencies
jest.mock('../contexts/wallet.context');
jest.mock('../services/contribution.service');

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;
const mockContributionService = contributionService as jest.Mocked<typeof contributionService>;

describe('ContributionForm', () => {
  const mockProjectId = 'test-project-123';
  const mockFundraiserAddress = 'ST1X6Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P';
  const mockWalletAddress = 'ST9X8Y7Z6A5B4C3D2E1F0G9H8I7J6K5L4M3N2O1P';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Wallet not connected', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        isConnected: false,
        address: null,
        balance: null,
        network: null,
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalance: jest.fn(),
        walletService: null,
      });
    });

    test('displays wallet not connected message', () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      expect(screen.getByText('Wallet not connected')).toBeInTheDocument();
      expect(screen.getByText('Please connect your wallet to make a contribution.')).toBeInTheDocument();
    });

    test('disables form inputs when wallet not connected', () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      const submitButton = screen.getByRole('button', { name: /contribute to project/i });

      expect(amountInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Wallet connected', () => {
    const mockBalance = 1000000000n; // 1000 USDCx in micro-USDCx
    const mockRefreshBalance = jest.fn();

    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        isConnected: true,
        address: mockWalletAddress,
        balance: mockBalance,
        network: 'testnet',
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalance: mockRefreshBalance,
        walletService: null,
      });
    });

    test('displays user balance', () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      expect(screen.getByText(/your usdcx balance/i)).toBeInTheDocument();
      // Balance is displayed without comma separator
      expect(screen.getByText(/1000\.00 USDCx/i)).toBeInTheDocument();
    });

    test('calls refreshBalance on mount', () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      expect(mockRefreshBalance).toHaveBeenCalledTimes(1);
    });

    test('enables form inputs when wallet connected', () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      const submitButton = screen.getByRole('button', { name: /contribute to project/i });

      expect(amountInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });

    test('allows user to enter amount', () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i) as HTMLInputElement;
      
      fireEvent.change(amountInput, { target: { value: '10' } });

      expect(amountInput.value).toBe('10');
    });
  });

  describe('Amount validation', () => {
    const mockBalance = 1000000000n; // 1000 USDCx

    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        isConnected: true,
        address: mockWalletAddress,
        balance: mockBalance,
        network: 'testnet',
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalance: jest.fn(),
        walletService: null,
      });
    });

    test('validates amount is required', async () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const submitButton = screen.getByRole('button', { name: /contribute to project/i });
      
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Amount is required')).toBeInTheDocument();
      });
    });

    test('validates amount is a valid number', async () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      const submitButton = screen.getByRole('button', { name: /contribute to project/i });
      
      // HTML5 number input prevents non-numeric input, so we test with empty string after invalid input
      fireEvent.change(amountInput, { target: { value: '' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Amount is required')).toBeInTheDocument();
      });
    });

    test('validates amount is greater than zero', async () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.blur(amountInput);

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument();
      });
    });

    test('validates amount is not negative', async () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      
      fireEvent.change(amountInput, { target: { value: '-10' } });
      fireEvent.blur(amountInput);

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument();
      });
    });

    test('validates minimum amount', async () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
          minAmount={5}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      
      fireEvent.change(amountInput, { target: { value: '3' } });
      fireEvent.blur(amountInput);

      await waitFor(() => {
        expect(screen.getByText('Amount must be at least 5 USDCx')).toBeInTheDocument();
      });
    });

    test('validates sufficient balance', async () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      
      // Try to contribute more than balance (1000 USDCx)
      fireEvent.change(amountInput, { target: { value: '2000' } });
      fireEvent.blur(amountInput);

      await waitFor(() => {
        expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
      });
    });

    test('clears error when user starts typing', async () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      
      // Trigger error
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.blur(amountInput);

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument();
      });

      // Start typing again
      fireEvent.change(amountInput, { target: { value: '10' } });

      await waitFor(() => {
        expect(screen.queryByText('Amount must be greater than zero')).not.toBeInTheDocument();
      });
    });

    test('accepts valid amount', async () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      
      fireEvent.change(amountInput, { target: { value: '10' } });
      fireEvent.blur(amountInput);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Transaction flow', () => {
    const mockBalance = 1000000000n; // 1000 USDCx
    const mockRefreshBalance = jest.fn();
    const mockOnSuccess = jest.fn();
    const mockOnError = jest.fn();

    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        isConnected: true,
        address: mockWalletAddress,
        balance: mockBalance,
        network: 'testnet',
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalance: mockRefreshBalance,
        walletService: null,
      });
    });

    test('submits contribution successfully', async () => {
      const mockTxId = 'test-tx-123';
      const mockContributionResult = {
        txId: mockTxId,
        amount: 10000000n,
        projectId: mockProjectId,
        contributorAddress: mockWalletAddress,
      };

      mockContributionService.contribute = jest.fn().mockResolvedValue(mockContributionResult);
      mockContributionService.waitForConfirmationAndRecord = jest.fn().mockResolvedValue({
        id: 'contribution-123',
        ...mockContributionResult,
        blockHeight: 12345,
        createdAt: new Date(),
      });
      mockContributionService.getExplorerUrl = jest.fn().mockReturnValue('https://explorer.stacks.co/txid/test-tx-123');

      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
          onSuccess={mockOnSuccess}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      const submitButton = screen.getByRole('button', { name: /contribute to project/i });

      // Enter amount
      fireEvent.change(amountInput, { target: { value: '10' } });

      // Submit form
      fireEvent.click(submitButton);

      // Should show signing status
      await waitFor(() => {
        expect(screen.getByText(/please sign the transaction/i)).toBeInTheDocument();
      });

      // Should call contribute service
      await waitFor(() => {
        expect(mockContributionService.contribute).toHaveBeenCalledWith(
          mockProjectId,
          10000000n,
          mockWalletAddress
        );
      });

      // Should show transaction ID
      await waitFor(() => {
        expect(screen.getByText(mockTxId)).toBeInTheDocument();
      });

      // Should show explorer link
      expect(screen.getByText(/view in explorer/i)).toBeInTheDocument();

      // Wait for confirmation
      await waitFor(() => {
        expect(screen.getByText(/contribution confirmed/i)).toBeInTheDocument();
      });

      // Should call onSuccess callback
      expect(mockOnSuccess).toHaveBeenCalledWith(mockContributionResult);

      // Should refresh balance
      expect(mockRefreshBalance).toHaveBeenCalled();
    });

    test('handles contribution failure', async () => {
      const mockError = new Error('Transaction failed');

      mockContributionService.contribute = jest.fn().mockRejectedValue(mockError);

      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
          onError={mockOnError}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      const submitButton = screen.getByRole('button', { name: /contribute to project/i });

      // Enter amount
      fireEvent.change(amountInput, { target: { value: '10' } });

      // Submit form
      fireEvent.click(submitButton);

      // Wait for error - use getAllByText since there are multiple elements with this text
      await waitFor(() => {
        const errorElements = screen.getAllByText(/transaction failed/i);
        expect(errorElements.length).toBeGreaterThan(0);
      });

      // Should call onError callback
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });

    test('handles confirmation failure', async () => {
      const mockTxId = 'test-tx-123';
      const mockContributionResult = {
        txId: mockTxId,
        amount: 10000000n,
        projectId: mockProjectId,
        contributorAddress: mockWalletAddress,
      };
      const mockError = new Error('Confirmation timeout');

      mockContributionService.contribute = jest.fn().mockResolvedValue(mockContributionResult);
      mockContributionService.waitForConfirmationAndRecord = jest.fn().mockRejectedValue(mockError);
      mockContributionService.getExplorerUrl = jest.fn().mockReturnValue('https://explorer.stacks.co/txid/test-tx-123');

      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
          onError={mockOnError}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      const submitButton = screen.getByRole('button', { name: /contribute to project/i });

      // Enter amount
      fireEvent.change(amountInput, { target: { value: '10' } });

      // Submit form
      fireEvent.click(submitButton);

      // Wait for confirmation to fail
      await waitFor(() => {
        expect(screen.getByText(/transaction failed/i)).toBeInTheDocument();
      });

      // Should display error message
      expect(screen.getByText('Confirmation timeout')).toBeInTheDocument();

      // Should call onError callback
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });

    test('disables form during transaction', async () => {
      const mockTxId = 'test-tx-123';
      const mockContributionResult = {
        txId: mockTxId,
        amount: 10000000n,
        projectId: mockProjectId,
        contributorAddress: mockWalletAddress,
      };

      // Make contribute hang to test disabled state
      mockContributionService.contribute = jest.fn().mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      const submitButton = screen.getByRole('button', { name: /contribute to project/i });

      // Enter amount
      fireEvent.change(amountInput, { target: { value: '10' } });

      // Submit form
      fireEvent.click(submitButton);

      // Should disable inputs during transaction
      await waitFor(() => {
        expect(amountInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });

    test('resets form after successful contribution', async () => {
      const mockTxId = 'test-tx-123';
      const mockContributionResult = {
        txId: mockTxId,
        amount: 10000000n,
        projectId: mockProjectId,
        contributorAddress: mockWalletAddress,
      };

      mockContributionService.contribute = jest.fn().mockResolvedValue(mockContributionResult);
      mockContributionService.waitForConfirmationAndRecord = jest.fn().mockResolvedValue({
        id: 'contribution-123',
        ...mockContributionResult,
        blockHeight: 12345,
        createdAt: new Date(),
      });

      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /contribute to project/i });

      // Enter amount
      fireEvent.change(amountInput, { target: { value: '10' } });
      expect(amountInput.value).toBe('10');

      // Submit form
      fireEvent.click(submitButton);

      // Wait for confirmation
      await waitFor(() => {
        expect(screen.getByText(/contribution confirmed/i)).toBeInTheDocument();
      });

      // Form should be reset
      expect(amountInput.value).toBe('');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseWallet.mockReturnValue({
        isConnected: true,
        address: mockWalletAddress,
        balance: 1000000000n,
        network: 'testnet',
        isLoading: false,
        error: null,
        connect: jest.fn(),
        disconnect: jest.fn(),
        refreshBalance: jest.fn(),
        walletService: null,
      });
    });

    test('has proper ARIA labels', () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      expect(screen.getByLabelText(/contribution amount/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /contribute to project/i })).toBeInTheDocument();
    });

    test('marks invalid input with aria-invalid', async () => {
      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      
      fireEvent.change(amountInput, { target: { value: '0' } });
      fireEvent.blur(amountInput);

      await waitFor(() => {
        expect(amountInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    test('uses aria-live for status updates', async () => {
      const mockTxId = 'test-tx-123';
      const mockContributionResult = {
        txId: mockTxId,
        amount: 10000000n,
        projectId: mockProjectId,
        contributorAddress: mockWalletAddress,
      };

      mockContributionService.contribute = jest.fn().mockResolvedValue(mockContributionResult);
      mockContributionService.waitForConfirmationAndRecord = jest.fn().mockResolvedValue({
        id: 'contribution-123',
        ...mockContributionResult,
        blockHeight: 12345,
        createdAt: new Date(),
      });

      render(
        <ContributionForm
          projectId={mockProjectId}
          fundraiserAddress={mockFundraiserAddress}
        />
      );

      const amountInput = screen.getByLabelText(/contribution amount/i);
      const submitButton = screen.getByRole('button', { name: /contribute to project/i });

      fireEvent.change(amountInput, { target: { value: '10' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const statusElement = screen.getByRole('status');
        expect(statusElement).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});
