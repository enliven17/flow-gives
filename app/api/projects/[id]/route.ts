/**
 * API Routes for Individual Projects
 * 
 * GET /api/projects/[id] - Get project details
 * PATCH /api/projects/[id] - Update project
 * DELETE /api/projects/[id] - Cancel project
 * 
 * Requirements: 2.2, 2.6, 2.9
 */

import { NextRequest, NextResponse } from 'next/server';
import { projectService, UpdateProjectInput } from '@/lib/services/project.service';


interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/projects/[id]
 * Get project details by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Get project from database
    const project = await projectService.getProject(id);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // If project has a blockchain contract ID, sync with blockchain
    // to get the latest data (blockchain is source of truth)
    // Note: This assumes your Project model has a contractId field
    // You may need to adjust based on your actual schema

    // For now, return the database project
    // In a full implementation, you would:
    // 1. Check if project has contractId
    // 2. If yes, fetch from blockchain using contractService
    // 3. Merge blockchain data (taking precedence over database)

    // Convert bigint fields to strings for JSON serialization
    const response = {
      ...project,
      fundingGoal: project.fundingGoal.toString(),
      totalRaised: project.totalRaised.toString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting project:', error);

    return NextResponse.json(
      { error: 'Failed to get project' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]
 * Update project details (draft projects only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Parse update input
    const input: UpdateProjectInput = {};

    if (body.title !== undefined) {
      input.title = body.title;
    }

    if (body.description !== undefined) {
      input.description = body.description;
    }

    if (body.fundingGoal !== undefined) {
      input.fundingGoal = BigInt(body.fundingGoal);
    }

    if (body.deadline !== undefined) {
      input.deadline = new Date(body.deadline);
    }

    if (body.imageUrl !== undefined) {
      input.imageUrl = body.imageUrl;
    }

    if (body.category !== undefined) {
      input.category = body.category;
    }

    // Update project
    const project = await projectService.updateProject(id, input);

    // Convert bigint fields to strings for JSON serialization
    const response = {
      ...project,
      fundingGoal: project.fundingGoal.toString(),
      totalRaised: project.totalRaised.toString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating project:', error);

    if (error instanceof Error) {
      // Not found error
      if (error.message === 'Project not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      // Validation or business rule errors
      if (
        error.message.includes('Validation failed') ||
        error.message.includes('Only draft projects')
      ) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Cancel a project (draft projects only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Cancel project
    await projectService.cancelProject(id);

    return NextResponse.json(
      { message: 'Project cancelled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling project:', error);

    if (error instanceof Error) {
      // Not found error
      if (error.message === 'Project not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }

      // Business rule error
      if (error.message.includes('Only draft projects')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to cancel project' },
      { status: 500 }
    );
  }
}
