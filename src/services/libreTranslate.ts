
export const LIBRE_TRANSLATE_API_URL = 'http://localhost:5000';

export interface TranslateResponse {
    translatedText: string;
    error?: string;
}

export async function translateText(
    text: string,
    targetLang: string = 'vi',
    sourceLang: string = 'auto'
): Promise<string> {
    try {
        const response = await fetch(`${LIBRE_TRANSLATE_API_URL}/translate`, {
            method: "POST",
            body: JSON.stringify({
                q: text,
                source: sourceLang,
                target: targetLang,
                format: "text",
                api_key: ""
            }),
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: TranslateResponse = await response.json();
        return data.translatedText;
    } catch (error) {
        console.error("Translation error:", error);
        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}
