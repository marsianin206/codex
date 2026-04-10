import YAML from 'yaml';
import TOML from 'toml';
import Ini from 'ini';
import Papa from 'papaparse';
import type { Language, ParseResult, TreeNode, CsvParseResult } from '../types';

const SIZE_THRESHOLD = 500 * 1024;

export function detectLanguage(content: string, filename?: string): Language {
  if (filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    const extensionMap: Record<string, Language> = {
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      csv: 'csv',
      xml: 'xml',
      toml: 'toml',
      ini: 'ini',
      conf: 'nginx',
      dockerfile: 'dockerfile',
      md: 'markdown',
      txt: 'plain',
      env: 'env',
    };
    if (ext && extensionMap[ext]) return extensionMap[ext];
  }

  const trimmed = content.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {}
  }

  if (trimmed.includes(':') && !trimmed.includes('{') && !trimmed.startsWith('[')) {
    try {
      YAML.parse(trimmed);
      return 'yaml';
    } catch {}
  }

  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<!DOCTYPE')) {
    return 'xml';
  }

  if (trimmed.includes(' = ') || trimmed.includes('[')) {
    try {
      const parsed = TOML.parse(trimmed);
      if (Object.keys(parsed).length > 0) return 'toml';
    } catch {}
  }

  if ((trimmed.includes('[') && trimmed.includes(']')) && trimmed.includes(',')) {
    const lines = trimmed.split('\n');
    if (lines.length > 1) {
      const commas = lines[0].split(',').length;
      if (commas > 2) return 'csv';
    }
  }

  if (trimmed.includes('=') && !trimmed.includes('{') && !trimmed.includes(':')) {
    try {
      const parsed = Ini.parse(trimmed);
      if (Object.keys(parsed).length > 0) return 'ini';
    } catch {}
  }

  if (trimmed.startsWith('#') && trimmed.includes('\n')) {
    if (trimmed.includes('version:') || trimmed.includes('FROM ')) {
      if (trimmed.includes('FROM ')) return 'dockerfile';
      if (trimmed.includes('server ') || trimmed.includes('location ')) return 'nginx';
    }
  }

  if (trimmed.startsWith('#') && trimmed.includes('\n')) {
    const headings = trimmed.match(/^#+ .+$/gm);
    if (headings && headings.length > 2) return 'markdown';
  }

  if (trimmed.includes('=') && trimmed.startsWith('#')) {
    return 'env';
  }

  return 'plain';
}

export function parseJson(content: string): ParseResult {
  try {
    const data = JSON.parse(content);
    const tree = buildJsonTree(content, data);
    return { data, language: 'json', tree };
  } catch (e) {
    return { data: null, error: (e as Error).message, language: 'json' };
  }
}

export function parseYaml(content: string): ParseResult {
  try {
    const data = YAML.parse(content);
    const tree = buildYamlTree(content, data);
    return { data, language: 'yaml', tree };
  } catch (e) {
    return { data: null, error: (e as Error).message, language: 'yaml' };
  }
}

export function parseXml(content: string): ParseResult {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    const error = doc.querySelector('parsererror');
    if (error) {
      return { data: null, error: error.textContent || 'Invalid XML', language: 'xml' };
    }
    const data = xmlToJson(doc.documentElement);
    return { data, language: 'xml' };
  } catch (e) {
    return { data: null, error: (e as Error).message, language: 'xml' };
  }
}

export function parseCsv(content: string, _limit = 1000): CsvParseResult {
  const lines = content.split('\n').filter(l => l.trim());
  const limit = Math.min(_limit, lines.length);
  const limitedContent = lines.slice(0, limit).join('\n');
  
  const result = Papa.parse<Record<string, string>>(limitedContent, {
    header: true,
    skipEmptyLines: true,
  });

  const totalLines = content.split('\n').filter(l => l.trim()).length;
  
  return {
    headers: result.meta.fields || [],
    rows: result.data,
    totalRows: totalLines,
  };
}

export function parseToml(content: string): ParseResult {
  try {
    const data = TOML.parse(content);
    return { data, language: 'toml' };
  } catch (e) {
    return { data: null, error: (e as Error).message, language: 'toml' };
  }
}

export function parseIni(content: string): ParseResult {
  try {
    const data = Ini.parse(content);
    return { data, language: 'ini' };
  } catch (e) {
    return { data: null, error: (e as Error).message, language: 'ini' };
  }
}

export function parseMarkdown(content: string): ParseResult {
  return { data: { raw: content }, language: 'markdown' };
}

export function parseContent(content: string, filename?: string): ParseResult {
  const lang = detectLanguage(content, filename);

  switch (lang) {
    case 'json':
      return parseJson(content);
    case 'yaml':
      return parseYaml(content);
    case 'yml':
      return parseYaml(content);
    case 'xml':
      return parseXml(content);
    case 'csv':
      const csv = parseCsv(content);
      return { data: csv, language: 'csv' };
    case 'toml':
      return parseToml(content);
    case 'ini':
      return parseIni(content);
    case 'markdown':
      return parseMarkdown(content);
    default:
      return { data: { raw: content }, language: 'plain' };
  }
}

function buildJsonTree(content: string, data: unknown, path = '$', lineOffset = 0): TreeNode[] {
  const lines = content.split('\n');
  const result: TreeNode[] = [];

  if (data === null) {
    return [{ key: path, value: null, type: 'null', path, lineNumber: 1 }];
  }

  if (Array.isArray(data)) {
    const arrNode: TreeNode = {
      key: path,
      value: data.length,
      type: 'array',
      path,
      lineNumber: 1,
      children: [],
    };
    
    data.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      const itemLine = lines.findIndex((_, i) => JSON.stringify(data[index])?.includes(lines[i])) + 1;
      
      if (typeof item === 'object' && item !== null) {
        arrNode.children!.push(...buildJsonTree(content, item, itemPath, itemLine));
      } else {
        arrNode.children!.push({
          key: itemPath,
          value: item,
          type: typeof item as TreeNode['type'],
          path: itemPath,
          lineNumber: itemLine || index + 1,
        });
      }
    });
    
    return [arrNode];
  }

  if (typeof data === 'object') {
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      const keyPath = path ? `${path}.${key}` : key;
      let lineNumber = 1;
      
      if (typeof value === 'object' && value !== null) {
        result.push(...buildJsonTree(content, value, keyPath, lineNumber));
      } else {
        result.push({
          key,
          value,
          type: typeof value as TreeNode['type'],
          path: keyPath,
          lineNumber,
        });
      }
    });
  }

  return result;
}

function buildYamlTree(content: string, data: unknown, path = ''): TreeNode[] {
  const result: TreeNode[] = [];

  if (data === null) {
    return [{ key: path || 'root', value: null, type: 'null', path: path || '$', lineNumber: 1 }];
  }

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      if (typeof item === 'object' && item !== null) {
        result.push(...buildYamlTree(content, item, itemPath));
      } else {
        result.push({
          key: itemPath,
          value: item,
          type: typeof item as TreeNode['type'],
          path: itemPath,
          lineNumber: 1,
        });
      }
    });
    return result;
  }

  if (typeof data === 'object') {
    Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
      const keyPath = path ? `${path}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        result.push(...buildYamlTree(content, value, keyPath));
      } else {
        result.push({
          key,
          value,
          type: typeof value as TreeNode['type'],
          path: keyPath,
          lineNumber: 1,
        });
      }
    });
  }

  return result;
}

function xmlToJson(node: Element): unknown {
  const obj: Record<string, unknown> = {};
  
  if (node.attributes.length > 0) {
    obj['@attributes'] = {};
    Array.from(node.attributes).forEach(attr => {
      (obj['@attributes'] as Record<string, string>)[attr.name] = attr.value;
    });
  }

  Array.from(node.children).forEach(child => {
    const result = xmlToJson(child);
    if (obj[child.tagName]) {
      if (!Array.isArray(obj[child.tagName])) {
        obj[child.tagName] = [obj[child.tagName]];
      }
      (obj[child.tagName] as unknown[]).push(result);
    } else {
      obj[child.tagName] = result;
    }
  });

  if (node.textContent?.trim()) {
    obj['#text'] = node.textContent.trim();
  }

  return Object.keys(obj).length === 0 ? node.textContent : obj;
}

export function computeContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}