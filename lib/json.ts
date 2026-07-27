export function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();

  const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  return cleaned;
}

export function safeJsonParse<T>(text: string): T | null {
  try {
    const cleaned = stripMarkdownFences(text);
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}
