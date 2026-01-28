/**
 * Cron job API route for updating expired projects
 * 
 * This endpoint should be called periodically (e.g., every hour) to check
 * for projects that have passed their deadline and update their status to "expired"
 * if they haven't reached their funding goal.
 * 
 * Requirements: 2.8
 */

import { NextResponse } from 'next/server';
import { projectService } from '@/lib/services/project.service';
import { ProjectStatus } from '@/lib/models/project';

export async function GET(request: Request) {
  try {
    // Verify the request is from a cron service (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all active projects
    const activeProjects = await projectService.listProjects({
      status: [ProjectStatus.ACTIVE],
    });

    const now = new Date();
    const expiredProjects: string[] = [];

    // Check each project for expiration
    for (const project of activeProjects) {
      if (project.deadline < now && project.totalRaised < project.fundingGoal) {
        try {
          // Update project status to expired
          await projectService.checkAndUpdateProjectStatus(project.id);
          expiredProjects.push(project.id);
        } catch (error) {
          console.error(`Failed to update project ${project.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${expiredProjects.length} expired projects`,
      expiredProjects,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to update expired projects',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: Request) {
  return GET(request);
}
