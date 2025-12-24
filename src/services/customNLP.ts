
export const CUSTOM_NLP_API_URL = 'http://localhost:8000';

export interface CustomTranslateResponse {
    translated_text: string;
    error?: string;
}

export async function translateWithCustomModel(
    text: string
): Promise<string> {
    try {
        const response = await fetch(`${CUSTOM_NLP_API_URL}/translate`, {
            method: "POST",
            body: JSON.stringify({
                text: text,
            }),
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            // Try to get error message from body
            try {
                const errData = await response.json();
                if (errData.detail) throw new Error(errData.detail);
            } catch (e) {
                // ignore
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: CustomTranslateResponse = await response.json();
        return data.translated_text;
    } catch (error) {
        console.error("Custom NLP Translation error:", error);
        // Throwing error allows the caller to handle it (e.g. fallback)
        throw error;
    }
}

export async function checkCustomModelHealth(): Promise<{ status: string; model_loaded: boolean; device?: string }> {
    try {
        const response = await fetch(`${CUSTOM_NLP_API_URL}/health`);
        if (response.ok) {
            return await response.json();
        }
        return { status: 'error', model_loaded: false };
    } catch (e) {
        return { status: 'down', model_loaded: false };
    }
}
