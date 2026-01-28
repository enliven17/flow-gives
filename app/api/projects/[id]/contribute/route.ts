import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/projects/[id]/contribute
 * Create a contribution transaction
 * 
 * This endpoint validates the contribution and creates a transaction
 * that the client can sign and broadcast.
 * 
 * Request body:
 * {
 *   amount: string; // bigint as string (micro-USDCx)
 *   contributorAddress: string;
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { amount, contributorAddress } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!amount || !contributorAddress) {
      return NextResponse.json(
        { error: 'Amount and contributor address are required' },
        { status: 400 }
      );
    }

    const amountBigInt = BigInt(amount);

    if (amountBigInt <= 0n) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    // Dynamic import to prevent client-side bundling
    const { projectRepository } = await import('@/lib/repositories/project.repository');

    // Validate project exists and is active
    const project = await projectRepository.findById(projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (project.status !== 'active') {
      return NextResponse.json(
        { error: 'Project is not active and cannot accept contributions' },
        { status: 400 }
      );
    }

    // Check if deadline has passed
    const now = new Date();
    if (project.deadline < now) {
      return NextResponse.json(
        { error: 'Project deadline has passed' },
        { status: 400 }
      );
    }

    // Return project info for client to create transaction
    // Client will create and sign the transaction
    return NextResponse.json({
      projectId,
      fundraiserAddress: project.fundraiserAddress,
      amount: amountBigInt.toString(),
      memo: `Contribution to project ${projectId}`,
    });
  } catch (error) {
    console.error('Error creating contribution transaction:', error);

    return NextResponse.json(
      {
        error: 'Failed to create contribution transaction',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
