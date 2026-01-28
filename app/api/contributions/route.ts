/**
 * API Routes for Contributions
 * 
 * POST /api/contributions - Record a confirmed contribution
 * GET /api/contributions - List contributions with filters
 * 
 * Requirements: 3.5, 3.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { contributionService, RecordContributionInput } from '@/lib/services/contribution.service';


/**
 * POST /api/contributions
 * Record a confirmed contribution in the database
 * 
 * This endpoint should be called after a contribution transaction
 * is confirmed on-chain to record it in the database.
 * 
 * Request body:
 * {
 *   projectId: string;
 *   contributorAddress: string;
 *   amount: string; // bigint as string
 *   txId: string;
 *   blockHeight: number;
 *   timestamp: string; // ISO date string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }
    if (!body.contributorAddress) {
      return NextResponse.json(
        { error: 'contributorAddress is required' },
        { status: 400 }
      );
    }
    if (!body.amount) {
      return NextResponse.json(
        { error: 'amount is required' },
        { status: 400 }
      );
    }
    if (!body.txId) {
      return NextResponse.json(
        { error: 'txId is required' },
        { status: 400 }
      );
    }
    if (body.blockHeight === undefined || body.blockHeight === null) {
      return NextResponse.json(
        { error: 'blockHeight is required' },
        { status: 400 }
      );
    }

    // Parse and validate input
    let amount: bigint;
    try {
      amount = BigInt(body.amount);
    } catch (e) {
      return NextResponse.json(
        { error: `Invalid amount format: ${body.amount}` },
        { status: 400 }
      );
    }

    if (amount <= 0n) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    const input: RecordContributionInput = {
      projectId: body.projectId,
      contributorAddress: body.contributorAddress,
      amount: amount,
      txId: body.txId,
      blockHeight: Number(body.blockHeight),
      timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    };

    // Verify contribution exists on blockchain before recording
    // This ensures we only record contributions that are confirmed on-chain
    // const contractService = getContractService();

    // Note: This requires the project to have a contractId
    // You may need to adjust based on your schema
    // For now, we'll record it directly

    // In a full implementation, you would:
    // 1. Get project's contractId from database
    // 2. Verify contribution exists on blockchain using contractService.getContribution
    // 3. Only record if verified

    // Record contribution
    console.log('Recording contribution:', {
      projectId: input.projectId,
      contributorAddress: input.contributorAddress,
      amount: input.amount.toString(),
      txId: input.txId,
      blockHeight: input.blockHeight,
    });
    
    const contribution = await contributionService.recordContribution(input);

    // Convert bigint fields to strings for JSON serialization
    const response = {
      ...contribution,
      amount: contribution.amount.toString(),
    };

    console.log('Contribution recorded successfully:', response.id);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error recording contribution:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }

    if (error instanceof Error) {
      // Duplicate contribution error
      if (error.message.includes('already recorded')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 } // Conflict
        );
      }

      // Project not found error
      if (error.message === 'Project not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      // Validation errors
      if (error.message.includes('Validation failed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    // Return detailed error message for debugging
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to record contribution';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contributions
 * List contributions with optional filters
 * 
 * Query parameters:
 * - contributorAddress: Filter by contributor wallet address
 * - limit: Maximum number of results
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get contributor address filter
    const contributorAddress = searchParams.get('contributorAddress');

    let contributions: Awaited<ReturnType<typeof contributionService.getContributorContributions>>;

    if (contributorAddress) {
      // Get contributions by specific contributor
      contributions = await contributionService.getContributorContributions(contributorAddress);
    } else {
      // If no filter specified, return empty array
      // (to avoid returning all contributions which could be large)
      contributions = [];
    }

    // Convert bigint fields to strings for JSON serialization
    const response = contributions.map(contribution => ({
      ...contribution,
      amount: contribution.amount.toString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing contributions:', error);

    return NextResponse.json(
      { error: 'Failed to list contributions' },
      { status: 500 }
    );
  }
}
