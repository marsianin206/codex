const SIZE_THRESHOLD = 500 * 1024;

export async function storeSnippetContent(
  content: string,
  snippetId: string,
  version: number
): Promise<{ content?: string; blobUrl?: string; size: number }> {
  const size = new TextEncoder().encode(content).length;

  if (size < SIZE_THRESHOLD) {
    return { content, size };
  }

  const blob = new Blob([content], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, `${snippetId}-${version}.txt`);

  if (process.env.BLOB_STORAGE_URL) {
    const response = await fetch(process.env.BLOB_STORAGE_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_STORAGE_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to store content in blob storage');
    }

    const data = await response.json();
    return { blobUrl: data.url, size };
  }

  return { content, size };
}

export async function getSnippetContent(
  content?: string,
  blobUrl?: string
): Promise<string> {
  if (content) {
    return content;
  }

  if (blobUrl) {
    const response = await fetch(blobUrl);
    return response.text();
  }

  return '';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}