import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { snippets, revisions } from '@/lib/db/schema';
import { getSnippetContent } from '@/lib/blob';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const snippet = await db.query.snippets.findFirst({
      where: eq(snippets.id, id),
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    if (snippet.visibility === 'private') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const latestRevision = await db.query.revisions.findFirst({
      where: eq(revisions.snippetId, id),
      orderBy: [desc(revisions.version)],
    });

    if (!latestRevision) {
      return NextResponse.json({ error: 'No content' }, { status: 404 });
    }

    const content = await getSnippetContent(
      latestRevision.content || undefined,
      latestRevision.blobUrl || undefined
    );

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching raw content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}