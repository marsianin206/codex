'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { cn, getRelativeTime, formatNumber } from '@/lib/utils';
import { 
  User, 
  MapPin, 
  Link as LinkIcon, 
  Star, 
  GitFork,
  FileText,
  Loader2,
  Settings
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Snippet {
  id: string;
  name: string;
  slug: string;
  description?: string;
  visibility: string;
  language: string;
  size: number;
  starCount: number;
  forkCount: number;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  id: string;
  name?: string;
  username: string;
  bio?: string;
  image?: string;
  website?: string;
  location?: string;
  createdAt: string;
}

export default function UserPage() {
  const params = useParams();
  const { data: session } = useSession();
  const username = params.username as string;

  const { data: userData, isLoading } = useQuery<{ user: UserProfile; snippets: Snippet[] }>({
    queryKey: ['user', username],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/snippets`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  const isOwner = session?.user?.name === username;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#0070F3]" />
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#888888]">User not found</p>
        </div>
      </div>
    );
  }

  const { user, snippets } = userData;

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-[#2A2A2A] bg-[#111111] px-4 py-8">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
            {user.image ? (
              <img
                src={user.image}
                alt={user.username}
                className="h-24 w-24 rounded-full border-4 border-[#0A0A0A]"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#0A0A0A] bg-[#1A1A1A]">
                <User className="h-12 w-12 text-[#666666]" />
              </div>
            )}

            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#EDEDED]">
                  {user.name || user.username}
                </h1>
                {isOwner && (
                  <Link
                    href="/settings"
                    className="rounded-lg border border-[#2A2A2A] p-2 text-[#888888] hover:border-[#3A3A3A] hover:text-[#EDEDED]"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                )}
              </div>

              <p className="mb-4 text-[#888888]">@{user.username}</p>

              {user.bio && (
                <p className="mb-4 max-w-2xl text-[#EDEDED]">{user.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-[#666666]">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </span>
                )}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-[#0070F3]"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  Joined {getRelativeTime(user.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-6 flex items-center gap-4">
            <h2 className="text-lg font-semibold text-[#EDEDED]">
              Snippets
            </h2>
            <span className="rounded-full bg-[#1A1A1A] px-2.5 py-0.5 text-xs font-medium text-[#888888]">
              {snippets.length}
            </span>
          </div>

          {snippets.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-[#2A2A2A] bg-[#111111] text-center">
              <FileText className="mb-3 h-8 w-8 text-[#2A2A2A]" />
              <p className="text-[#888888]">No snippets yet</p>
              {isOwner && (
                <Link
                  href="/new"
                  className="mt-3 rounded-lg bg-[#0070F3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0051A8]"
                >
                  Create Your First Snippet
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {snippets.map((snippet) => (
                <Link
                  key={snippet.id}
                  href={`/${username}/${snippet.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-[#2A2A2A] bg-[#111111] p-4 transition-all hover:border-[#3A3A3A]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium text-[#EDEDED] group-hover:text-[#0070F3]">
                        {snippet.name}
                      </h3>
                      <span className="rounded-full border border-[#2A2A2A] px-1.5 py-0.5 text-xs text-[#666666]">
                        {snippet.language.toUpperCase()}
                      </span>
                    </div>
                    {snippet.description && (
                      <p className="mt-1 truncate text-sm text-[#888888]">
                        {snippet.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#666666]">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {formatNumber(snippet.starCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" />
                      {formatNumber(snippet.forkCount)}
                    </span>
                    <span className="hidden sm:block">
                      {getRelativeTime(snippet.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}