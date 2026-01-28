import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/projects/[id]/comments
 * Get all comments for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Dynamic import to prevent client-side bundling
    const { supabaseAdmin } = await import('@/lib/supabase/server');

    // Fetch comments with author info
    const { data: comments, error } = await supabaseAdmin
      .from('comments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    // Convert date strings to ISO strings for JSON serialization
    // Convert date strings to ISO strings for JSON serialization
    const response = comments?.map((comment: any) => ({
      ...comment,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
    })) || [];

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching comments:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch comments',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/comments
 * Create a new comment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { authorAddress, content, parentId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!authorAddress || !content) {
      return NextResponse.json(
        { error: 'Author address and content are required' },
        { status: 400 }
      );
    }

    if (content.length === 0 || content.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be between 1 and 2000 characters' },
        { status: 400 }
      );
    }

    // Dynamic import to prevent client-side bundling
    const { supabaseAdmin } = await import('@/lib/supabase/server');

    // Verify project exists
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Verify user exists or create
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('wallet_address')
      .eq('wallet_address', authorAddress)
      .single();

    if (!existingUser) {
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({ wallet_address: authorAddress } as any);

      if (userError) {
        throw new Error(`Failed to create user: ${userError.message}`);
      }
    }

    // Create comment
    const commentData: any = {
      project_id: projectId,
      author_address: authorAddress,
      content: content.trim(),
    };

    if (parentId) {
      commentData.parent_id = parentId;
    }

    const { data: comment, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert(commentData as any)
      .select()
      .single();

    if (commentError) {
      throw new Error(`Failed to create comment: ${commentError.message}`);
    }

    return NextResponse.json(
      {
        ...(comment as any),
        createdAt: (comment as any)?.created_at,
        updatedAt: (comment as any)?.updated_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);

    return NextResponse.json(
      {
        error: 'Failed to create comment',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
