import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { snippets, revisions, users } from '@/lib/db/schema';
import { getSnippetContent, storeSnippetContent } from '@/lib/blob';
import { and, eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const snippet = await db.query.snippets.findFirst({
      where: eq(snippets.id, id),
      with: {
        user: true,
      },
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    if (snippet.visibility === 'private') {
      const session = await auth();
      if (!session?.user?.id || session.user.id !== snippet.userId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    await db.update(snippets)
      .set({ viewCount: snippet.viewCount + 1 })
      .where(eq(snippets.id, id));

    const revisionList = await db.query.revisions.findMany({
      where: eq(revisions.snippetId, id),
      orderBy: [desc(revisions.version)],
      with: {
        author: true,
      },
    });

    let content = '';
    if (revisionList[0]) {
      content = await getSnippetContent(
        revisionList[0].content || undefined,
        revisionList[0].blobUrl || undefined
      );
    }

    return NextResponse.json({
      snippet: {
        ...snippet,
        content,
        revisions: revisionList,
      },
    });
  } catch (error) {
    console.error('Error fetching snippet:', error);
    return NextResponse.json({ error: 'Failed to fetch snippet' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content, commitMessage } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const snippet = await db.query.snippets.findFirst({
      where: eq(snippets.id, id),
    });

    if (!snippet || snippet.userId !== session.user.id) {
      return NextResponse.json({ error: 'Snippet not found or unauthorized' }, { status: 404 });
    }

    const latestRevision = await db.query.revisions.findFirst({
      where: eq(revisions.snippetId, id),
      orderBy: [desc(revisions.version)],
    });

    const newVersion = (latestRevision?.version || 0) + 1;
    const size = new TextEncoder().encode(content).length;
    
    const { blobUrl } = await storeSnippetContent(content, id, newVersion);

    await db.insert(revisions).values({
      snippetId: id,
      version: newVersion,
      content: blobUrl ? undefined : content,
      blobUrl: blobUrl || undefined,
      size,
      commitMessage: commitMessage || `Update ${snippet.name}`,
      commitHash: content.slice(0, 40),
      authorId: session.user.id,
    });

    await db.update(snippets)
      .set({
        size,
        updatedAt: new Date(),
      })
      .where(eq(snippets.id, id));

    return NextResponse.json({
      snippet: snippet,
      version: newVersion,
    });
  } catch (error) {
    console.error('Error updating snippet:', error);
    return NextResponse.json({ error: 'Failed to update snippet' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const snippet = await db.query.snippets.findFirst({
      where: eq(snippets.id, id),
    });

    if (!snippet || snippet.userId !== session.user.id) {
      return NextResponse.json({ error: 'Snippet not found or unauthorized' }, { status: 404 });
    }

    await db.delete(snippets).where(eq(snippets.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting snippet:', error);
    return NextResponse.json({ error: 'Failed to delete snippet' }, { status: 500 });
  }
}