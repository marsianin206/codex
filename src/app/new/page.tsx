'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { cn, slugify } from '@/lib/utils';
import { detectLanguage, parseContent } from '@/lib/parsers';
import type { Language, ParseResult } from '@/lib/types';
import { 
  Code2, 
  Eye, 
  FileCode, 
  FolderOpen, 
  Save, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1E1E1E]">
      <Loader2 className="h-6 w-6 animate-spin text-[#0070F3]" />
    </div>
  )
});

interface Tab {
  id: string;
  label: string;
}

const tabs: Tab[] = [
  { id: 'code', label: 'Code' },
  { id: 'preview', label: 'Preview' },
  { id: 'structure', label: 'Structure' },
  { id: 'raw', label: 'Raw' },
];

const languages: { value: Language; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'csv', label: 'CSV' },
  { value: 'xml', label: 'XML' },
  { value: 'toml', label: 'TOML' },
  { value: 'ini', label: 'INI' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plain', label: 'Plain Text' },
];

export default function NewSnippetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public');
  const [language, setLanguage] = useState<Language>('plain');
  const [commitMessage, setCommitMessage] = useState('Initial commit');
  const [activeTab, setActiveTab] = useState('code');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);

  const handleContentChange = useCallback((value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    
    if (newContent.trim()) {
      const detected = detectLanguage(newContent);
      if (language === 'plain') {
        setLanguage(detected);
      }
      if (['json', 'yaml', 'xml', 'toml'].includes(detected)) {
        setParseResult(parseContent(newContent));
      }
    }
  }, [language]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    if (content.trim()) {
      setParseResult(parseContent(content));
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    if (!name.trim() || name.length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          visibility,
          language,
          content,
          commitMessage: commitMessage.trim() || 'Initial commit',
          tags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create snippet');
      }

      const username = session.user?.name || session.user?.email || 'user';
      router.push(`/${username}/${data.snippet.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create snippet');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#0070F3]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="flex items-center gap-4 border-b border-[#2A2A2A] bg-[#111111] px-4 py-3">
          <div className="flex flex-1 items-center gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Snippet name..."
              className="flex-1 bg-transparent text-lg font-semibold text-[#EDEDED] placeholder:text-[#666666] focus:outline-none"
            />
            <span className="text-sm text-[#666666]">
              {language.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-[#0070F3] px-4 py-2 text-sm font-medium text-white transition-colors",
                "hover:bg-[#0051A8] disabled:opacity-50"
              )}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-[#E5484D]/10 px-4 py-2 text-sm text-[#E5484D]">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <div className="w-[60%] border-r border-[#2A2A2A]">
            <div className="flex border-b border-[#2A2A2A]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-b-2 border-[#0070F3] text-[#EDEDED]"
                      : "text-[#888888] hover:text-[#EDEDED]"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="h-[calc(100%-41px)]">
              {activeTab === 'code' && (
                <MonacoEditor
                  height="100%"
                  language={language === 'yaml' ? 'yaml' : language}
                  theme="vs-dark"
                  value={content}
                  onChange={handleContentChange}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                  }}
                />
              )}

              {activeTab === 'preview' && (
                <div className="h-full overflow-auto bg-[#111111] p-4">
                  {parseResult?.error ? (
                    <div className="flex items-center gap-2 text-sm text-[#E5484D]">
                      <AlertCircle className="h-4 w-4" />
                      <span>Parse error: {parseResult.error}</span>
                    </div>
                  ) : parseResult?.language === 'json' ? (
                    <pre className="text-sm text-[#EDEDED] font-mono whitespace-pre-wrap">
                      {JSON.stringify(parseResult?.data, null, 2)}
                    </pre>
                  ) : parseResult?.language === 'yaml' ? (
                    <pre className="text-sm text-[#EDEDED] font-mono whitespace-pre-wrap">
                      {JSON.stringify(parseResult?.data, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-sm text-[#888888]">
                      Preview not available for this format
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'structure' && (
                <div className="h-full overflow-auto bg-[#111111] p-4">
                  {parseResult?.tree && parseResult.tree.length > 0 ? (
                    <div className="font-mono text-sm">
                      {parseResult.tree.map((node, i) => (
                        <div key={i} className="py-1 text-[#EDEDED]">
                          <span className="text-[#0070F3]">{node.key}</span>
                          <span className="text-[#666666]">: </span>
                          <span className="text-[#79C0FF]">
                            {typeof node.value === 'object' 
                              ? JSON.stringify(node.value) 
                              : String(node.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#888888]">
                      No structure available
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'raw' && (
                <div className="h-full overflow-auto bg-[#111111] p-4">
                  <pre className="font-mono text-sm text-[#EDEDED] whitespace-pre-wrap">
                    {content || '// Start typing...'}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="w-[40%] flex flex-col">
            <div className="border-b border-[#2A2A2A] bg-[#111111] p-4">
              <h3 className="mb-4 text-sm font-medium text-[#EDEDED]">Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs text-[#888888]">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#EDEDED] placeholder:text-[#666666] focus:border-[#0070F3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-[#888888]">Language</label>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as Language)}
                    className="w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#EDEDED] focus:border-[#0070F3] focus:outline-none"
                  >
                    {languages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-[#888888]">Visibility</label>
                  <div className="flex gap-2">
                    {(['public', 'private', 'unlisted'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVisibility(v)}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors",
                          visibility === v
                            ? "border-[#0070F3] bg-[#0070F3]/10 text-[#EDEDED]"
                            : "border-[#2A2A2A] text-[#888888] hover:border-[#3A3A3A]"
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-[#888888]">Commit message</label>
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    className="w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#EDEDED] placeholder:text-[#666666] focus:border-[#0070F3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-[#888888]">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-2 py-1 text-xs text-[#888888]"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-[#666666] hover:text-[#EDEDED]"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {tags.length < 5 && (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Add tag..."
                      className="w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-[#EDEDED] placeholder:text-[#666666] focus:border-[#0070F3] focus:outline-none"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}