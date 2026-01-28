/**
 * API Route for Publishing Projects
 * 
 * POST /api/projects/[id]/publish - Publish a draft project
 * 
 * Requirements: 2.4, 2.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/lib/services/project.service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/projects/[id]/publish
 * Publish a draft project, transitioning it to active status
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Publish project
    const project = await projectService.publishProject(id);

    // Convert bigint fields to strings for JSON serialization
    const response = {
      ...project,
      fundingGoal: project.fundingGoal.toString(),
      totalRaised: project.totalRaised.toString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error publishing project:', error);
    
    if (error instanceof Error) {
      // Not found error
      if (error.message === 'Project not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      
      // Validation or business rule errors
      if (error.message.includes('Cannot publish project')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to publish project' },
      { status: 500 }
    );
  }
}
