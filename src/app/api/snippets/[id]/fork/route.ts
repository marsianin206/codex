import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { snippets, revisions, forks } from '@/lib/db/schema';
import { storeSnippetContent } from '@/lib/blob';
import { slugify } from '@/lib/utils';
import { eq, desc } from 'drizzle-orm';

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

    const originalSnippet = await db.query.snippets.findFirst({
      where: eq(snippets.id, id),
    });

    if (!originalSnippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    const latestRevision = await db.query.revisions.findFirst({
      where: eq(revisions.snippetId, id),
      orderBy: [desc(revisions.version)],
    });

    let content = '';
    if (latestRevision) {
      content = latestRevision.content || '';
      if (latestRevision.blobUrl && !content) {
        const response = await fetch(latestRevision.blobUrl);
        content = await response.text();
      }
    }

    const newSlug = slugify(originalSnippet.name) + '-fork-' + Date.now().toString(36);
    const size = new TextEncoder().encode(content).length;

    const forkedSnippet = await db.insert(snippets).values({
      userId,
      name: originalSnippet.name + ' (Fork)',
      slug: newSlug,
      description: originalSnippet.description,
      visibility: originalSnippet.visibility,
      language: originalSnippet.language,
      size,
    }).returning();

    const forkedSnippetId = forkedSnippet[0].id;

    const { blobUrl } = await storeSnippetContent(content, forkedSnippetId.toString(), 1);

    await db.insert(revisions).values({
      snippetId: forkedSnippetId,
      version: 1,
      content: blobUrl ? undefined : content,
      blobUrl: blobUrl || undefined,
      size,
      commitMessage: 'Fork from ' + originalSnippet.name,
      commitHash: content.slice(0, 40),
      authorId: userId,
    });

    await db.insert(forks).values({
      originalSnippetId: id,
      forkedSnippetId,
      userId,
    });

    await db.update(snippets)
      .set({ forkCount: originalSnippet.forkCount + 1 })
      .where(eq(snippets.id, id));

    return NextResponse.json({
      snippet: forkedSnippet[0],
    });
  } catch (error) {
    console.error('Error forking snippet:', error);
    return NextResponse.json({ error: 'Failed to fork snippet' }, { status: 500 });
  }
}