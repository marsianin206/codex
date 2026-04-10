'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/lib/hooks';
import { cn, getRelativeTime, formatNumber } from '@/lib/utils';
import { 
  Search, 
  Filter, 
  Star, 
  GitFork, 
  Eye,
  FileJson,
  FileText,
  FileSpreadsheet,
  Code2,
  ChevronDown,
  Loader2,
  TrendingUp
} from 'lucide-react';

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
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    name?: string;
    image?: string;
  };
}

const languages = [
  { value: '', label: 'All Languages' },
  { value: 'json', label: 'JSON', icon: FileJson },
  { value: 'yaml', label: 'YAML', icon: FileText },
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { value: 'xml', label: 'XML', icon: Code2 },
  { value: 'toml', label: 'TOML', icon: FileText },
  { value: 'markdown', label: 'Markdown', icon: FileText },
  { value: 'plain', label: 'Plain Text', icon: FileText },
];

const sortOptions = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'stars', label: 'Most Starred' },
  { value: 'created', label: 'Newest' },
];

const periodOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [sort, setSort] = useState('updated');
  const [period, setPeriod] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['snippets', debouncedSearch, language, sort, period, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (language) params.set('language', language);
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '20');

      const response = await fetch(`/api/snippets?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  const snippets: Snippet[] = data?.snippets || [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-[#2A2A2A] bg-[#111111] px-4 py-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="mb-4 text-2xl font-bold text-[#EDEDED]">Explore</h1>
          
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search snippets..."
                  className="w-full h-10 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] pl-10 pr-4 text-sm text-[#EDEDED] placeholder:text-[#666666] focus:border-[#0070F3] focus:outline-none"
                />
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-10 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#EDEDED] focus:border-[#0070F3] focus:outline-none"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex rounded-lg border border-[#2A2A2A] p-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSort(option.value)}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                      sort === option.value
                        ? "bg-[#0070F3] text-white"
                        : "text-[#888888] hover:text-[#EDEDED]"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="container mx-auto max-w-6xl">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#0070F3]" />
            </div>
          ) : snippets.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <FileText className="mb-4 h-12 w-12 text-[#2A2A2A]" />
              <p className="text-lg text-[#888888]">No snippets found</p>
              <p className="text-sm text-[#666666]">
                Be the first to create a snippet!
              </p>
              <Link
                href="/new"
                className="mt-4 rounded-lg bg-[#0070F3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0051A8]"
              >
                Create Snippet
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {snippets.map((snippet) => (
                <Link
                  key={snippet.id}
                  href={`/${snippet.user.username}/${snippet.slug}`}
                  className="group flex flex-col rounded-xl border border-[#2A2A2A] bg-[#111111] p-5 transition-all hover:border-[#3A3A3A] hover:shadow-xl hover:shadow-black/20"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-0.5 text-xs font-medium text-[#888888]">
                        {snippet.language.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#666666]">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {formatNumber(snippet.starCount)}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="h-3 w-3" />
                        {formatNumber(snippet.forkCount)}
                      </span>
                    </div>
                  </div>

                  <h3 className="mb-2 truncate text-base font-semibold text-[#EDEDED] group-hover:text-[#0070F3]">
                    {snippet.name}
                  </h3>

                  {snippet.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-[#888888]">
                      {snippet.description}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center gap-2">
                      {snippet.user.image ? (
                        <img
                          src={snippet.user.image}
                          alt={snippet.user.username}
                          className="h-5 w-5 rounded-full"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-[#2A2A2A]" />
                      )}
                      <span className="text-xs text-[#888888]">
                        {snippet.user.username}
                      </span>
                    </div>
                    <span className="text-xs text-[#666666]">
                      {getRelativeTime(snippet.updatedAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {snippets.length > 0 && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-sm text-[#888888] hover:border-[#3A3A3A] hover:text-[#EDEDED] disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-[#666666]">
                  Page {page}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={snippets.length < 20}
                  className="rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-sm text-[#888888] hover:border-[#3A3A3A] hover:text-[#EDEDED] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}