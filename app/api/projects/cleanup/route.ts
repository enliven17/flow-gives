/**
 * API Route for Cleaning Up Duplicate Projects
 * 
 * DELETE /api/projects/cleanup - Remove duplicate example projects
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * DELETE /api/projects/cleanup
 * Remove duplicate example projects, keeping only the newest one of each title
 */
export async function DELETE() {
  try {
    const fundraiserAddress = 'ST19EWTQXJHNE6QTTSJYET2079J91CM9BRQ8XAH1V';
    const exampleTitles = [
      'Community Garden Initiative',
      'Tech Education for Kids'
    ];

    let deletedCount = 0;
    const errors: string[] = [];

    for (const title of exampleTitles) {
      // Find all projects with this title and creator
      const { data: projects, error: fetchError } = await supabaseAdmin
        .from('projects')
        .select('id, created_at, title')
        .eq('title', title)
        .eq('creator_address', fundraiserAddress)
        .order('created_at', { ascending: false });

      if (fetchError) {
        errors.push(`Failed to fetch projects with title "${title}": ${fetchError.message}`);
        continue;
      }

      if (!projects || projects.length === 0) {
        // No projects with this title
        continue;
      }

      if (projects.length <= 1) {
        // No duplicates for this title
        continue;
      }

      // Keep the newest one (first in the sorted list), delete the rest
      const projectsToDelete = (projects as any[]).slice(1);
      const idsToDelete = projectsToDelete.map((p: any) => p.id);

      console.log(`Deleting ${idsToDelete.length} duplicate(s) for "${title}":`, idsToDelete);

      const { error: deleteError } = await supabaseAdmin
        .from('projects')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        errors.push(`Failed to delete duplicates for "${title}": ${deleteError.message}`);
      } else {
        deletedCount += projectsToDelete.length;
      }
    }

    // Also check for any other duplicates by this creator
    const { data: allProjects, error: allError } = await supabaseAdmin
      .from('projects')
      .select('id, title, created_at')
      .eq('creator_address', fundraiserAddress)
      .order('created_at', { ascending: false });

    if (!allError && allProjects) {
      // Group by title and find duplicates
      const titleGroups = new Map<string, any[]>();
      for (const project of (allProjects as any[])) {
        if (!titleGroups.has(project.title)) {
          titleGroups.set(project.title, []);
        }
        titleGroups.get(project.title)!.push(project);
      }

      // Delete duplicates from all groups
      for (const [, groupProjects] of titleGroups) {
        if (groupProjects.length > 1) {
          // Keep newest, delete rest
          const toDelete = groupProjects.slice(1);
          const deleteIds = toDelete.map((p: any) => p.id);

          const { error: delError } = await supabaseAdmin
            .from('projects')
            .delete()
            .in('id', deleteIds);

          if (!delError) {
            deletedCount += toDelete.length;
          }
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          message: `Cleanup completed with errors. Deleted ${deletedCount} duplicate projects.`,
          deletedCount,
          errors,
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json(
      {
        message: `Successfully deleted ${deletedCount} duplicate projects.`,
        deletedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cleaning up projects:', error);

    return NextResponse.json(
      {
        error: 'Failed to cleanup duplicate projects',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
