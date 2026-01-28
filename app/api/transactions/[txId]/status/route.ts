import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/transactions/[txId]/status
 * Get transaction status from Stacks API (server-side proxy to avoid CORS)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ txId: string }> }
) {
  try {
    const { txId } = await params;

    if (!txId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Get network from environment
    const network = process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet';
    const apiUrl = network === 'mainnet'
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so';

    // Fetch transaction from Stacks API (server-side, no CORS issues)
    const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Transaction not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Map API status to our status enum
    let status: 'pending' | 'confirmed' | 'failed';
    if (data.tx_status === 'pending') {
      status = 'pending';
    } else if (data.tx_status === 'success') {
      status = 'confirmed';
    } else {
      status = 'failed';
    }

    return NextResponse.json({
      txId: data.tx_id,
      status,
      blockHeight: data.block_height,
      error: data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition'
        ? `Transaction aborted: ${data.tx_status}`
        : undefined,
    });
  } catch (error) {
    console.error('Error fetching transaction status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch transaction status',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
