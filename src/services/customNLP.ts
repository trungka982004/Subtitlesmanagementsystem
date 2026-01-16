
export const CUSTOM_NLP_API_URL = 'http://localhost:8000';

export interface CustomTranslateResponse {
    translated_text: string;
    error?: string;
}

export async function translateWithCustomModel(
    text: string,
    modelId?: string
): Promise<string> {
    try {
        const response = await fetch(`${CUSTOM_NLP_API_URL}/translate`, {
            method: "POST",
            body: JSON.stringify({
                text: text,
                model_id: modelId
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

export async function translateBatchWithCustomModel(
    texts: string[],
    modelId?: string
): Promise<string[]> {
    try {
        const response = await fetch(`${CUSTOM_NLP_API_URL}/translate_batch`, {
            method: "POST",
            body: JSON.stringify({
                texts: texts,
                model_id: modelId
            }),
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            try {
                const errData = await response.json();
                if (errData.detail) throw new Error(errData.detail);
            } catch (e) {
                // ignore
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: { translated_texts: string[] } = await response.json();
        return data.translated_texts;
    } catch (error) {
        console.error("Custom NLP Batch Translation error:", error);
        throw error;
    }
}

export async function getModelVersions(): Promise<{ available_versions: string[]; current_version: string | null }> {
    try {
        const response = await fetch(`${CUSTOM_NLP_API_URL}/versions`);
        if (response.ok) {
            return await response.json();
        }
        return { available_versions: [], current_version: null };
    } catch (e) {
        console.error("Error fetching model versions:", e);
        return { available_versions: [], current_version: null };
    }
}

export async function setModelVersion(version: string): Promise<{ status: string; current_version: string }> {
    const response = await fetch(`${CUSTOM_NLP_API_URL}/set_version`, {
        method: "POST",
        body: JSON.stringify({ version }),
        headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) {
        throw new Error(`Failed to set version: ${response.statusText}`);
    }
    return await response.json();
}

export async function checkCustomModelHealth(): Promise<{ status: string; model_loaded: boolean; device?: string; current_version?: string }> {
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
