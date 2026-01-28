/**
 * API Route for Seeding Example Projects
 * 
 * POST /api/projects/seed - Create example projects for testing
 */

import { NextResponse } from 'next/server';
import { projectService, CreateProjectInput } from '@/lib/services/project.service';

import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/projects/seed
 * Create example projects
 */
export async function POST() {
  try {
    // First, ensure the user exists in the users table (required by foreign key)
    const fundraiserAddress = 'ST19EWTQXJHNE6QTTSJYET2079J91CM9BRQ8XAH1V';

    // Check if user exists, if not create it
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('wallet_address')
      .eq('wallet_address', fundraiserAddress)
      .single();

    if (!existingUser) {
      // Create user if it doesn't exist
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({ wallet_address: fundraiserAddress } as any);

      if (userError) {
        throw new Error(`Failed to create user: ${userError.message}`);
      }
    }
    // Example project 1: Community Garden Initiative
    const project1: CreateProjectInput = {
      title: 'Community Garden Initiative',
      description: 'Help us create a beautiful community garden in the heart of the city. This project will provide fresh vegetables for local families and create a green space for everyone to enjoy. We need funding for seeds, tools, irrigation systems, and garden beds.',
      fundingGoal: BigInt(5000 * 1_000_000), // 5000 USDCx in micro-USDCx
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      fundraiserAddress: fundraiserAddress, // Testnet address
      imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
      // category removed - not in current database schema
    };

    // Example project 2: Tech Education for Kids
    const project2: CreateProjectInput = {
      title: 'Tech Education for Kids',
      description: 'Bring coding and technology education to underserved communities. We will provide free coding workshops, laptops, and mentorship programs for children aged 8-16. Your contribution will help us purchase equipment and hire qualified instructors.',
      fundingGoal: BigInt(10000 * 1_000_000), // 10000 USDCx in micro-USDCx
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      fundraiserAddress: fundraiserAddress, // Testnet address
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      // category removed - not in current database schema
    };

    // Check if projects with these titles already exist
    const { data: existingProjects } = await supabaseAdmin
      .from('projects')
      .select('id, title, image_url')
      .eq('creator_address', fundraiserAddress)
      .in('title', [project1.title, project2.title]);

    const projectsData = existingProjects as any[] || [];
    const existingTitles = new Set(projectsData.map(p => p.title));
    const projectsToUpdate: Array<{ id: string; imageUrl: string }> = [];
    const projectsToCreate: CreateProjectInput[] = [];

    // Check which projects need to be created or updated
    if (!existingTitles.has(project1.title)) {
      projectsToCreate.push(project1);
    } else {
      // Find existing project and check if it needs image update
      const existing = projectsData.find(p => p.title === project1.title);
      if (existing && !existing.image_url) {
        projectsToUpdate.push({ id: existing.id, imageUrl: project1.imageUrl! });
      }
    }

    if (!existingTitles.has(project2.title)) {
      projectsToCreate.push(project2);
    } else {
      // Find existing project and check if it needs image update
      const existing = projectsData.find(p => p.title === project2.title);
      if (existing && !existing.image_url) {
        projectsToUpdate.push({ id: existing.id, imageUrl: project2.imageUrl! });
      }
    }

    // Update existing projects with images if they don't have one
    if (projectsToUpdate.length > 0) {
      await Promise.all(
        projectsToUpdate.map(({ id, imageUrl }) =>
          projectService.updateProject(id, { imageUrl })
        )
      );
    }

    // Create projects that don't exist yet
    const createdProjects = projectsToCreate.length > 0
      ? await Promise.all(
        projectsToCreate.map(project => projectService.createProject(project))
      )
      : [];

    // Get all projects (created + updated) for response
    const allProjectIds = [
      ...createdProjects.map(p => p.id),
      ...projectsToUpdate.map(p => p.id),
    ];

    const allProjects = await Promise.all(
      allProjectIds.map(id => projectService.getProject(id))
    );

    const finalProjects = allProjects.filter((p): p is NonNullable<typeof p> => p !== null);

    // Note: Projects are already created as 'active' status in the new schema
    // No need to publish them separately

    // Convert bigint fields to strings for JSON serialization
    const response = finalProjects.map(project => ({
      ...project,
      fundingGoal: project.fundingGoal.toString(),
      totalRaised: project.totalRaised.toString(),
    }));

    const messages: string[] = [];
    if (createdProjects.length > 0) {
      messages.push(`Created ${createdProjects.length} new project(s)`);
    }
    if (projectsToUpdate.length > 0) {
      messages.push(`Updated ${projectsToUpdate.length} existing project(s) with images`);
    }
    if (createdProjects.length === 0 && projectsToUpdate.length === 0) {
      messages.push('All example projects already exist with images');
    }

    return NextResponse.json(
      {
        message: messages.join('. ') || 'Example projects processed successfully',
        projects: response,
        created: createdProjects.length,
        updated: projectsToUpdate.length,
      },
      { status: createdProjects.length > 0 ? 201 : 200 }
    );
  } catch (error) {
    console.error('Error seeding projects:', error);

    if (error instanceof Error) {
      // Check if projects already exist
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Example projects may already exist' },
          { status: 409 }
        );
      }

      // Return detailed error message for debugging
      return NextResponse.json(
        {
          error: 'Failed to seed example projects',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to seed example projects',
        details: 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
