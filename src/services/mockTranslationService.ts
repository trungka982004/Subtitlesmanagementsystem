
interface MockTranslationResponse {
    translations: {
        opus?: string;
        mbart?: string;
        nllb?: string;
    };
}

export const fetchMockTranslations = async (text: string): Promise<MockTranslationResponse> => {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1000));

    // Placeholder logic simply appending model names for visual verification
    // In a real scenario, this would call actual APIs
    return {
        translations: {
            opus: `[Opus] ${text} (Translated)`,
            mbart: `[mBART] ${text} (Translated)`,
            nllb: `[NLLB] ${text} (Translated)`,
        },
    };
};
