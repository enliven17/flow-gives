import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/transactions/[txId]
 * Get transaction details from Stacks API (server-side proxy to avoid CORS)
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

    // Transform to match Transaction interface
    return NextResponse.json({
      txId: data.tx_id,
      txStatus: data.tx_status,
      txType: data.tx_type,
      fee: data.fee_rate,
      senderAddress: data.sender_address,
      blockHeight: data.block_height,
      blockHash: data.block_hash,
      blockTime: data.block_time,
      contractCall: data.contract_call
        ? {
            contractId: data.contract_call.contract_id,
            functionName: data.contract_call.function_name,
            functionArgs: data.contract_call.function_args,
          }
        : undefined,
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch transaction',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
