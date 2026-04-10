import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { snippets, users } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const sort = searchParams.get('sort') || 'updated';

    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const orderBy = sort === 'stars'
      ? desc(snippets.starCount)
      : sort === 'created'
        ? desc(snippets.createdAt)
        : desc(snippets.updatedAt);

    const userSnippets = await db.query.snippets.findMany({
      where: eq(snippets.userId, user.id),
      orderBy: [orderBy],
      limit,
      offset,
    });

    return NextResponse.json({
      snippets: userSnippets,
      page,
      limit,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        image: user.image,
      },
    });
  } catch (error) {
    console.error('Error fetching user snippets:', error);
    return NextResponse.json({ error: 'Failed to fetch snippets' }, { status: 500 });
  }
}