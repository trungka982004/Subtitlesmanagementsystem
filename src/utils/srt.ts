import { SubtitleEntry } from '../types';

/**
 * Parses raw SRT string content into structured SubtitleEntry objects.
 * Handles standard SRT formatting including ID, timestamp parsing, and text extraction.
 */
export const parseSRT = (content: string): SubtitleEntry[] => {
    if (!content) return [];
    const normalizeContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const entries: SubtitleEntry[] = [];
    const blocks = normalizeContent.trim().split(/\n\s*\n/);

    blocks.forEach(block => {
        const lines = block.split('\n').map(l => l.trim());
        if (lines.length >= 3) {
            // Attempt to parse ID
            const idStr = lines[0];
            const id = parseInt(idStr);

            // Locate timestamp line (conventionally line 2, but scanning for safety)
            const timeLineIndex = lines.findIndex(l => l.includes('-->'));

            if (timeLineIndex !== -1) {
                const timeMatch = lines[timeLineIndex].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);

                if (timeMatch) {
                    const text = lines.slice(timeLineIndex + 1).join('\n');
                    entries.push({
                        id: !isNaN(id) ? id : entries.length + 1,
                        startTime: timeMatch[1],
                        endTime: timeMatch[2],
                        text,
                    });
                }
            }
        }
    });

    return entries;
};

/**
 * Serializes subtitle entries to a JSON string for database persistence.
 * This preserves full object state including translations and metadata.
 */
export const serializeEntriesToJSON = (entries: SubtitleEntry[]): string => {
    return JSON.stringify(entries);
}

// And a parser that handles both
export const parseContent = (content: string): SubtitleEntry[] => {
    if (!content) return [];
    try {
        // Try JSON first (for persisted state with translations)
        const json = JSON.parse(content);
        if (Array.isArray(json)) return json;
    } catch (e) {
        // Not JSON, fall back to SRT parser
    }
    return parseSRT(content);
}
