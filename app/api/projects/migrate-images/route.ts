/**
 * API Route for Running Image URL Migration
 * 
 * POST /api/projects/migrate-images - Add image_url column to projects table
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/projects/migrate-images
 * Add image_url column to projects table if it doesn't exist
 */
export async function POST() {
  try {
    // Use raw SQL query to add column
    // Note: This requires the service role key and may not work in all Supabase setups
    const { error } = await (supabaseAdmin.rpc('exec', {
      query: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;'
    } as any) as any).catch(async () => {
      // If RPC doesn't work, try using the REST API with a direct SQL query
      // This is a workaround - ideally you'd run the migration via Supabase CLI or Dashboard
      return { error: { message: 'RPC not available. Please run migration manually.' } };
    });

    if (error) {
      // Provide manual instructions
      return NextResponse.json(
        {
          message: 'Migration requires manual execution',
          instructions: [
            '1. Go to your Supabase Dashboard',
            '2. Navigate to SQL Editor',
            '3. Run this SQL:',
            '   ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;',
            '4. Then call /api/projects/add-images to add images to existing projects'
          ],
          sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Successfully added image_url column to projects table',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error running migration:', error);

    return NextResponse.json(
      {
        message: 'Migration requires manual execution',
        instructions: [
          '1. Go to your Supabase Dashboard',
          '2. Navigate to SQL Editor',
          '3. Run this SQL:',
          '   ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;',
          '4. Then call /api/projects/add-images to add images to existing projects'
        ],
        sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
