/**
 * API Routes for Projects
 * 
 * POST /api/projects - Create a new project
 * GET /api/projects - List projects with filters
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { projectService, CreateProjectInput } from '@/lib/services/project.service';
import { ProjectStatus } from '@/lib/models/project';
import { ProjectFilters } from '@/lib/repositories/project.repository';


/**
 * POST /api/projects
 * Create a new project in draft status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Parse and validate input
    const input: CreateProjectInput = {
      title: body.title,
      description: body.description,
      fundingGoal: BigInt(body.fundingGoal),
      deadline: new Date(body.deadline),
      fundraiserAddress: body.fundraiserAddress,
      imageUrl: body.imageUrl,
      category: body.category,
    };

    // Create project
    const project = await projectService.createProject(input);

    // Convert bigint fields to strings for JSON serialization
    const response = {
      ...project,
      fundingGoal: project.fundingGoal.toString(),
      totalRaised: project.totalRaised.toString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);

    if (error instanceof Error) {
      // Validation errors
      if (error.message.includes('Validation failed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects
 * List projects with optional filters
 * 
 * Query parameters:
 * - status: Filter by project status (comma-separated for multiple)
 * - category: Filter by category
 * - fundraiserAddress: Filter by fundraiser
 * - sortBy: Sort order (newest, mostFunded, endingSoon)
 * - limit: Maximum number of results
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Build filters from query parameters
    const filters: ProjectFilters = {};

    // Parse status filter
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const statuses = statusParam.split(',').map(s => s.trim() as ProjectStatus);
      filters.status = statuses;
    }

    // Parse category filter
    const category = searchParams.get('category');
    if (category) {
      filters.category = category;
    }

    // Parse fundraiser address filter
    const fundraiserAddress = searchParams.get('fundraiserAddress');
    if (fundraiserAddress) {
      filters.fundraiserAddress = fundraiserAddress;
    }

    // Parse sort option
    const sortBy = searchParams.get('sortBy');
    if (sortBy && ['newest', 'mostFunded', 'endingSoon'].includes(sortBy)) {
      filters.sortBy = sortBy as 'newest' | 'mostFunded' | 'endingSoon';
    }

    // Parse pagination
    const limit = searchParams.get('limit');
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get('offset');
    if (offset) {
      filters.offset = parseInt(offset, 10);
    }

    // Get projects from database
    const projects = await projectService.listProjects(filters);

    // Optionally sync with blockchain for projects that have contract_id
    // This ensures we have the latest data from blockchain
    // const contractService = getContractService();
    // const syncService = getSyncService();

    // Enhance projects with blockchain data if available
    const enhancedProjects = await Promise.all(
      projects.map(async (project) => {
        // If project has a blockchain ID, fetch latest data from contract
        // Note: This assumes your Project model has a contractId field
        // You may need to adjust based on your actual schema

        // For now, return the database project
        // In a full implementation, you would:
        // 1. Check if project has contractId
        // 2. Fetch from blockchain if it does
        // 3. Merge blockchain data (taking precedence)

        return project;
      })
    );

    // Remove duplicates by ID (in case of any data inconsistency)
    const uniqueProjects = Array.from(
      new Map(enhancedProjects.map(p => [p.id, p])).values()
    );

    // Convert bigint fields to strings for JSON serialization
    const response = uniqueProjects.map(project => ({
      ...project,
      fundingGoal: project.fundingGoal.toString(),
      totalRaised: project.totalRaised.toString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing projects:', error);

    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    );
  }
}
