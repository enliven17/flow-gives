/**
 * Seed Sample Project
 * 
 * Creates a sample crowdfunding project for testing and demonstration purposes.
 * This allows users to test the contribution flow without creating their own project.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedSampleProject() {
  console.log('🌱 Seeding sample project...');

  const creatorAddress = '0x0ee0a7ac3ca6d12c';

  try {
    // First, ensure the creator user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('wallet_address', creatorAddress)
      .single();

    if (!existingUser) {
      console.log('Creating creator user...');
      const { error: userError } = await supabase
        .from('users')
        .insert([{ wallet_address: creatorAddress }]);

      if (userError) {
        console.error('❌ Error creating user:', userError);
        process.exit(1);
      }
      console.log('✅ Creator user created');
    }

    // Sample project data
    const sampleProject = {
      title: 'FlowGives Platform Development',
      description: `Help us build the future of decentralized crowdfunding on Flow blockchain!

🎯 Project Goals:
• Develop a fully decentralized crowdfunding platform
• Enable transparent and secure project funding
• Build community-driven innovation tools
• Create educational resources for Flow developers

💡 Why This Matters:
Traditional crowdfunding platforms charge high fees and lack transparency. FlowGives leverages Flow blockchain to provide:
- Zero platform fees (only blockchain transaction costs)
- Complete transparency of all transactions
- Instant fund transfers to project creators
- Immutable record of all contributions

🚀 What We'll Build:
1. Enhanced project discovery and search
2. Real-time contribution tracking
3. Project milestone tracking system
4. Community voting features
5. Mobile-responsive design improvements

📊 Fund Allocation:
• 40% - Development team salaries
• 30% - Infrastructure and hosting
• 20% - Marketing and community growth
• 10% - Security audits and testing

🎁 Contributor Benefits:
• Early access to new features
• Recognition on our contributors page
• Exclusive community Discord role
• Input on platform roadmap decisions

Join us in revolutionizing crowdfunding on Flow blockchain! Every contribution helps us build a more transparent and accessible funding platform for everyone.

Thank you for your support! 🙏`,
      goal_amount: '100000000000', // 1000 FLOW (8 decimals)
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      creator_address: creatorAddress,
      status: 'active',
      current_amount: '25000000000', // 250 FLOW already raised
      image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80', // Flow blockchain themed image
    };

    // Check if sample project already exists
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('title', sampleProject.title)
      .single();

    if (existing) {
      console.log('✅ Sample project already exists:', existing.id);
      console.log('🔗 View at: http://localhost:3000/projects/' + existing.id);
      return;
    }

    // Insert new sample project
    const { data, error } = await supabase
      .from('projects')
      .insert([sampleProject])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating sample project:', error);
      process.exit(1);
    }

    console.log('✅ Sample project created successfully!');
    console.log('📝 Project ID:', data.id);
    console.log('🔗 View at: http://localhost:3000/projects/' + data.id);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the seed function
seedSampleProject()
  .then(() => {
    console.log('🎉 Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
