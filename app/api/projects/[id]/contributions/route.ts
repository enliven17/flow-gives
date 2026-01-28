/**
 * API Route for Project Contributions
 * 
 * GET /api/projects/[id]/contributions - Get contributions for a specific project
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
 * GET /api/projects/[id]/contributions
 * Get all contributions for a specific project
 * 
 * Query parameters:
 * - limit: Maximum number of contributions to return (optional)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;

    // Parse limit parameter
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    // Get contributions for project
    const contributions = await contributionService.getProjectContributions(id, limit);

    // Convert bigint fields to strings for JSON serialization
    const response = contributions.map(contribution => ({
      ...contribution,
      amount: contribution.amount.toString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting project contributions:', error);
    
    return NextResponse.json(
      { error: 'Failed to get project contributions' },
      { status: 500 }
    );
  }
}
