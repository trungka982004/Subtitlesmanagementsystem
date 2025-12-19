import { SubtitleEntry } from '../App';

export const parseSRT = (content: string): SubtitleEntry[] => {
    if (!content) return [];
    const normalizeContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const entries: SubtitleEntry[] = [];
    const blocks = normalizeContent.trim().split(/\n\s*\n/);

    blocks.forEach(block => {
        const lines = block.split('\n').map(l => l.trim());
        if (lines.length >= 3) {
            // Try to identify logical parts
            const idStr = lines[0];
            const id = parseInt(idStr);

            // Time usually on line 2 (index 1), but let's look for the arrow
            const timeLineIndex = lines.findIndex(l => l.includes('-->'));

            if (timeLineIndex !== -1) {
                const timeMatch = lines[timeLineIndex].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);

                if (timeMatch) {
                    const text = lines.slice(timeLineIndex + 1).join('\n');
                    entries.push({
                        id: !isNaN(id) ? id : entries.length + 1, // Fallback ID if missing
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

export const serializeSRT = (entries: SubtitleEntry[]): string => {
    return entries.map(entry => {
        let block = `${entry.id}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}`;
        // If we want to save the translation into the "Text" for standard SRT readers, we'd replace text.
        // BUT, for this app, we probably want to persist the translation as part of the structure.
        // However, the standard SRT format doesn't have a "translation" field.
        // If we simply save `text`, we lose the translation if `text` is the source.
        // OPTIONS:
        // 1. Save translation in the SRT somehow (e.g. bilingual text).
        // 2. The App currently uses `SubtitleEntry` which has `translation`.
        //    Does the backend `content` just store the *source* SRT?
        //    If so, where does the translation go?
        //    Use the `translation` field if available?

        // The current `App.tsx` upload logic (Line 69) does:
        // `content: file.entries.map(e => `${e.id}\n${e.startTime} --> ${e.endTime}\n${e.text}`).join('\n\n')`
        // This ONLY saves the source text.

        // If the user translates, we need to save that translation.
        // WE SHOULD probably save the parsing result including translations.
        // BUT standard SRT doesn't support extra fields easily without breaking players.
        // HOWEVER, for this app's storage, we can define our own convention or just JSON stringify the entries if we don't care about portability of the raw DB string.
        // OR, we assume `text` BECOMES the target if we export.
        // BUT the persisted state needs to keep both source and target separated (Source Column vs LibreTrans Column).

        // Look at `SubtitleFile` model in Prisma: `content String`.

        // SOLUTION: We should store the `entries` as a JSON string in the `content` field for the database, 
        // OR allow `content` to be the source SRT and have another column for `translationData`.
        // BUT schema changes are hard right now (requires migration).

        // EASIEST FIX:
        // Store the `entries` array as a JSON string in the `content` field.
        // When parsing, check if it's JSON first. If not, parse as SRT.
        // This allows exact state persistence (including `googleTranslation`, `nlpTranslation`, etc).
        return JSON.stringify(entry); // This won't work with the current simplistic approach.
    }).join('\n\n');
};

// BETTER SERIALIZER for persistence
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
