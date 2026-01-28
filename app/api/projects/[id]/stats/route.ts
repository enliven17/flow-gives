/**
 * API Route for Project Contribution Statistics
 * 
 * GET /api/projects/[id]/stats - Get contribution statistics for a project
 * 
 * Requirements: 3.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { contributionService } from '@/lib/services/contribution.service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/projects/[id]/stats
 * Get aggregated contribution statistics for a project
 * 
 * Returns:
 * {
 *   totalRaised: string; // bigint as string
 *   contributorCount: number;
 *   averageContribution: string; // bigint as string
 *   largestContribution: string; // bigint as string
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Get contribution statistics
    const stats = await contributionService.getContributionStats(id);

    // Convert bigint fields to strings for JSON serialization
    const response = {
      totalRaised: stats.totalRaised.toString(),
      contributorCount: stats.contributorCount,
      averageContribution: stats.averageContribution.toString(),
      largestContribution: stats.largestContribution.toString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting project statistics:', error);
    
    return NextResponse.json(
      { error: 'Failed to get project statistics' },
      { status: 500 }
    );
  }
}
