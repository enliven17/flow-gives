/**
 * API Route for Cleaning Up ALL Duplicate Projects
 * 
 * DELETE /api/projects/cleanup-all - Remove ALL duplicate projects (more aggressive)
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * DELETE /api/projects/cleanup-all
 * Remove ALL duplicate projects, keeping only the newest one of each title+creator combination
 */
export async function DELETE() {
  try {
    const fundraiserAddress = 'ST19EWTQXJHNE6QTTSJYET2079J91CM9BRQ8XAH1V';

    // Get ALL projects by this creator
    const { data: allProjects, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, title, created_at, creator_address')
      .eq('creator_address', fundraiserAddress)
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch projects: ${fetchError.message}`);
    }

    if (!allProjects || allProjects.length === 0) {
      return NextResponse.json(
        { message: 'No projects found', deletedCount: 0 },
        { status: 200 }
      );
    }

    // Group projects by title
    const titleGroups = new Map<string, any[]>();
    for (const project of (allProjects as any[])) {
      if (!titleGroups.has(project.title)) {
        titleGroups.set(project.title, []);
      }
      titleGroups.get(project.title)!.push(project);
    }

    let deletedCount = 0;
    const errors: string[] = [];
    const allIdsToDelete: string[] = [];

    // For each title group, keep only the newest one
    for (const [title, projects] of titleGroups) {
      if (projects.length > 1) {
        // Keep the first one (newest), delete the rest
        const toDelete = projects.slice(1);
        const deleteIds = toDelete.map((p: any) => p.id);
        allIdsToDelete.push(...deleteIds);

        console.log(`Will delete ${deleteIds.length} duplicate(s) for "${title}"`);
      }
    }

    // Delete all duplicates in one batch
    if (allIdsToDelete.length > 0) {
      // Delete in batches of 100 (Supabase limit)
      const batchSize = 100;
      for (let i = 0; i < allIdsToDelete.length; i += batchSize) {
        const batch = allIdsToDelete.slice(i, i + batchSize);
        const { error: deleteError } = await supabaseAdmin
          .from('projects')
          .delete()
          .in('id', batch);

        if (deleteError) {
          errors.push(`Failed to delete batch: ${deleteError.message}`);
        } else {
          deletedCount += batch.length;
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          message: `Cleanup completed with errors. Deleted ${deletedCount} duplicate projects.`,
          deletedCount,
          errors,
          totalProjects: allProjects.length,
          uniqueTitles: titleGroups.size,
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json(
      {
        message: `Successfully deleted ${deletedCount} duplicate projects.`,
        deletedCount,
        totalProjects: allProjects.length,
        uniqueTitles: titleGroups.size,
        remainingProjects: allProjects.length - deletedCount,
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
