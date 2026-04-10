import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { snippets, revisions, snippetTags, tags } from '@/lib/db/schema';
import { detectLanguage, parseContent, computeContentHash } from '@/lib/parsers';
import { storeSnippetContent } from '@/lib/blob';
import { slugify } from '@/lib/utils';
import { eq, desc, and, or, ilike } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language');
  const visibility = searchParams.get('visibility');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'updated_at';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    
    if (language) {
      conditions.push(eq(snippets.language, language));
    }
    
    if (visibility) {
      conditions.push(eq(snippets.visibility, visibility as 'public' | 'private' | 'unlisted'));
    } else {
      conditions.push(eq(snippets.visibility, 'public' as const));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(snippets.name, `%${search}%`),
          ilike(snippets.description, `%${search}%`)
        )
      );
    }

    const orderBy = sort === 'stars' 
      ? desc(snippets.starCount)
      : sort === 'created'
        ? desc(snippets.createdAt)
        : desc(snippets.updatedAt);

    const results = await db.query.snippets.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [orderBy],
      limit,
      offset,
      with: {
        user: true,
      },
    });

    return NextResponse.json({
      snippets: results,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching snippets:', error);
    return NextResponse.json({ error: 'Failed to fetch snippets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, visibility = 'public', language, content, commitMessage, tags: tagNames } = body;

    if (!name || name.length < 3 || name.length > 100) {
      return NextResponse.json({ error: 'Name must be between 3 and 100 characters' }, { status: 400 });
    }

    if (!content || content.length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const detectedLanguage = language || detectLanguage(content);
    const slug = slugify(name) + '-' + Date.now().toString(36);
    const size = new TextEncoder().encode(content).length;
    const commitHash = computeContentHash(content);
    const userId = session.user.id;

    const snippet = await db.insert(snippets).values({
      userId,
      name,
      slug,
      description,
      visibility: visibility as 'public' | 'private' | 'unlisted',
      language: detectedLanguage,
      size,
    }).returning();

    const snippetId = snippet[0].id;

    const { blobUrl } = await storeSnippetContent(content, snippetId.toString(), 1);

    await db.insert(revisions).values({
      snippetId,
      version: 1,
      content: blobUrl ? undefined : content,
      blobUrl: blobUrl || undefined,
      size,
      commitMessage: commitMessage || 'Initial commit',
      commitHash,
      authorId: userId,
    });

    if (tagNames && tagNames.length > 0) {
      for (const tagName of tagNames) {
        const slugName = slugify(tagName);
        
        let existingTag = await db.query.tags.findFirst({
          where: eq(tags.slug, slugName),
        });

        if (!existingTag) {
          const newTag = await db.insert(tags).values({
            name: tagName,
            slug: slugName,
          }).returning();
          existingTag = newTag[0];
        }

        await db.insert(snippetTags).values({
          snippetId,
          tagId: existingTag.id,
        });
      }
    }

    return NextResponse.json({
      snippet: snippet[0],
    });
  } catch (error) {
    console.error('Error creating snippet:', error);
    return NextResponse.json({ error: 'Failed to create snippet' }, { status: 500 });
  }
}