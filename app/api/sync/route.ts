/**
 * Sync API Endpoint
 * 
 * POST /api/sync - Manually trigger synchronization between blockchain and database
 * 
 * This endpoint allows administrators to manually trigger a sync operation
 * to ensure database state matches blockchain state.
 * 
 * Requirements: 4.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync.service';

/**
 * POST /api/sync
 * Trigger synchronization
 * 
 * Request body (optional):
 * {
 *   action?: 'start' | 'stop' | 'sync'; // Action to perform
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // Only authorized users should be able to trigger sync

    const body = await request.json().catch(() => ({}));
    const action = body.action || 'sync';

    // Create sync service instance
    const syncService = new SyncService({
      pollInterval: 60000, // 1 minute
      startBlock: 0,
    });

    if (action === 'start') {
      // Start continuous sync
      await syncService.start();
      return NextResponse.json({
        message: 'Sync service started',
      });
    } else if (action === 'stop') {
      // Stop sync service
      await syncService.stop();
      return NextResponse.json({
        message: 'Sync service stopped',
      });
    } else {
      // One-time sync
      await syncService.syncProjects();
      await syncService.syncContributions();
      await syncService.syncWithdrawals();
      await syncService.syncRefunds();

      return NextResponse.json({
        message: 'Sync completed successfully',
      });
    }
  } catch (error) {
    console.error('Error syncing:', error);

    return NextResponse.json(
      {
        error: 'Failed to sync',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync
 * Get sync status (if you implement sync tracking)
 */
export async function GET() {
  try {
    // Return sync status information
    // This could include last sync time, pending syncs, etc.

    return NextResponse.json({
      message: 'Sync service is available',
      // Add more status information as needed
    });
  } catch (error) {
    console.error('Error getting sync status:', error);

    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
