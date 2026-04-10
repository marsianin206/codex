import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { snippets, stars } from '@/lib/db/schema';
import { and, eq, or } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const existingStar = await db.query.stars.findFirst({
      where: and(
        eq(stars.userId, userId),
        eq(stars.snippetId, id)
      ),
    });

    if (existingStar) {
      await db.delete(stars).where(
        and(
          eq(stars.userId, userId),
          eq(stars.snippetId, id)
        )
      );

      const snippet = await db.query.snippets.findFirst({
        where: eq(snippets.id, id),
      });

      if (snippet) {
        await db.update(snippets)
          .set({ starCount: Math.max(0, snippet.starCount - 1) })
          .where(eq(snippets.id, id));
      }

      return NextResponse.json({ starred: false });
    }

    await db.insert(stars).values({
      userId,
      snippetId: id,
    });

    const snippet = await db.query.snippets.findFirst({
      where: eq(snippets.id, id),
    });

    if (snippet) {
      await db.update(snippets)
        .set({ starCount: snippet.starCount + 1 })
        .where(eq(snippets.id, id));
    }

    return NextResponse.json({ starred: true });
  } catch (error) {
    console.error('Error toggling star:', error);
    return NextResponse.json({ error: 'Failed to toggle star' }, { status: 500 });
  }
}