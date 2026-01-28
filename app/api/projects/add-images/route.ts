/**
 * API Route for Adding Images to Existing Projects
 * 
 * POST /api/projects/add-images - Add image URLs to existing projects
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/projects/add-images
 * Add image URLs to existing projects that don't have images
 */
export async function POST() {
  try {
    const fundraiserAddress = 'ST19EWTQXJHNE6QTTSJYET2079J91CM9BRQ8XAH1V';

    const projectImages = {
      'Community Garden Initiative': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
      'Tech Education for Kids': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    };

    // Get all projects by this creator
    const { data: projects, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, title')
      .eq('creator_address', fundraiserAddress) as any;

    if (fetchError) {
      throw new Error(`Failed to fetch projects: ${fetchError.message}`);
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json(
        { message: 'No projects found', updated: 0 },
        { status: 200 }
      );
    }

    let updatedCount = 0;
    const errors: string[] = [];

    // First, ensure image_url column exists (add it if it doesn't)
    try {
      await (supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;'
      } as any) as any).catch(() => {
        // If RPC doesn't work, try direct SQL (may require different approach)
      });
    } catch {
      // Column might already exist or we need to add it via migration
      console.log('Note: image_url column may need to be added via migration');
    }

    // Update each project with its image
    for (const project of (projects || []) as any[]) {
      const imageUrl = projectImages[project.title as keyof typeof projectImages];

      if (imageUrl) {
        try {
          // Try direct update first (works if column exists)
          const { error: updateError } = await (supabaseAdmin
            .from('projects') as any)
            .update({ image_url: imageUrl })
            .eq('id', project.id);

          if (updateError) {
            // If column doesn't exist, try using projectService
            if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
              // Column doesn't exist - skip for now
              errors.push(`Column image_url doesn't exist for "${project.title}". Please run migration first.`);
            } else {
              errors.push(`Failed to update "${project.title}": ${updateError.message}`);
            }
          } else {
            updatedCount++;
          }
        } catch (error) {
          errors.push(`Failed to update "${project.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          message: `Updated ${updatedCount} project(s) with images. Some errors occurred.`,
          updated: updatedCount,
          errors,
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json(
      {
        message: `Successfully added images to ${updatedCount} project(s)`,
        updated: updatedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error adding images to projects:', error);

    return NextResponse.json(
      {
        error: 'Failed to add images to projects',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
