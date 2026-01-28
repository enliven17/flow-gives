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
import { getSyncService } from '@/lib/services/sync.service';

/**
 * POST /api/sync
 * Trigger synchronization
 * 
 * Request body (optional):
 * {
 *   projectId?: string; // Sync specific project (blockchain ID as string)
 *   syncAll?: boolean;   // Sync all projects
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // Only authorized users should be able to trigger sync

    const body = await request.json().catch(() => ({}));
    const syncService = getSyncService();

    if (body.projectId) {
      // Sync specific project
      const projectId = BigInt(body.projectId);
      await syncService.syncProject(projectId);

      return NextResponse.json({
        message: `Project ${projectId} synced successfully`,
        projectId: projectId.toString(),
      });
    } else if (body.syncAll) {
      // Sync all projects
      const result = await syncService.syncAllProjects();

      return NextResponse.json({
        message: 'Sync completed',
        projectsSynced: result.projectsSynced,
        contributionsSynced: result.contributionsSynced,
        errors: result.errors,
      });
    } else {
      return NextResponse.json(
        { error: 'Either projectId or syncAll must be provided' },
        { status: 400 }
      );
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
