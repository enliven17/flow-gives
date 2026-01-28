/**
 * Server-side Supabase admin client
 * 
 * This should ONLY be used in server components and API routes.
 * Never import this in client components - use lib/supabase/client.ts instead.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

function createSupabaseAdmin() {
  // Only access env vars on server-side
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used in server components and API routes');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    // During build, env vars might not be available
    // Return a dummy client that will fail gracefully
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL) {
      console.warn('Missing Supabase environment variables. Some features may not work.');
    }
    // Use placeholder values that won't cause immediate errors
    return createClient<Database>(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseServiceKey || 'placeholder-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  // Server-side client with service role key for admin operations
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Create singleton instance
export const supabaseAdmin = createSupabaseAdmin();
