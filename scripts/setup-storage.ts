#!/usr/bin/env node

/**
 * Setup Supabase Storage Bucket for Project Images
 * 
 * This script creates the 'project-images' storage bucket in Supabase
 * with public access for reading images.
 * 
 * Usage:
 *   tsx scripts/setup-storage.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupStorage() {
  console.log('📦 Setting up Supabase Storage for project images...\n');

  const bucketName = 'project-images';

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (bucketExists) {
      console.log(`✅ Bucket "${bucketName}" already exists`);
      return;
    }

    // Create bucket
    console.log(`Creating bucket "${bucketName}"...`);
    const { data: bucket, error: createError } = await supabase.storage.createBucket(
      bucketName,
      {
        public: true, // Make bucket public for image access
        fileSizeLimit: 5242880, // 5MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      }
    );

    if (createError) {
      throw createError;
    }

    console.log(`✅ Successfully created bucket "${bucketName}"`);
    console.log('\n📝 Next steps:');
    console.log('   1. Go to your Supabase Dashboard');
    console.log('   2. Navigate to Storage > project-images');
    console.log('   3. Verify the bucket is set to "Public"');
    console.log('   4. You can now upload project images!\n');
  } catch (error) {
    console.error('❌ Error setting up storage:', error);
    console.error('\n💡 Alternative: Create the bucket manually in Supabase Dashboard:');
    console.error('   1. Go to Storage in your Supabase Dashboard');
    console.error('   2. Click "New bucket"');
    console.error(`   3. Name it "${bucketName}"`);
    console.error('   4. Set it to "Public"');
    console.error('   5. Set file size limit to 5MB');
    console.error('   6. Add allowed MIME types: image/jpeg, image/png, image/gif, image/webp\n');
    process.exit(1);
  }
}

setupStorage();
