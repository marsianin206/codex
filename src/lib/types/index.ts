export type Language = 
  | 'json' 
  | 'yaml' 
  | 'yml' 
  | 'csv' 
  | 'xml' 
  | 'toml' 
  | 'ini' 
  | 'markdown' 
  | 'dockerfile' 
  | 'nginx'
  | 'plain'
  | 'env';

export type Visibility = 'public' | 'private' | 'unlisted';

export interface TreeNode {
  key: string;
  value: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  path: string;
  lineNumber: number;
  children?: TreeNode[];
}

export interface ParseResult {
  data: unknown;
  error?: string;
  language: Language;
  tree?: TreeNode[];
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffResult {
  lines: DiffLine[];
  additions: number;
  deletions: number;
}

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export interface CreateSnippetInput {
  name: string;
  description?: string;
  visibility: Visibility;
  language?: Language;
  content: string;
  commitMessage?: string;
  tags?: string[];
}

export interface UpdateSnippetInput {
  content: string;
  commitMessage?: string;
}

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string;
}