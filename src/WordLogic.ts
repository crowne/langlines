export class WordLogic {
    private dictionaries: Map<string, Set<string>>;
    private definitions: Map<string, { translation: string, meaning: string }>;

    constructor() {
        this.dictionaries = new Map();
        this.definitions = new Map();
    }

    async loadDictionary(url: string, lang: string): Promise<void> {
        try {
            const response = await fetch(url);
            const data: string[] = await response.json();
            const set = new Set(data.map(word => word.toUpperCase()));
            this.dictionaries.set(lang, set);
            console.log(`Loaded ${set.size} words from ${url} for lang: ${lang}`);
        } catch (err) {
            console.error(`Failed to load dictionary ${url}`, err);
            throw err;
        }
    }

    async loadDefinitions(url: string): Promise<void> {
        try {
            const response = await fetch(url);
            const data: Record<string, { translation: string, meaning: string }> = await response.json();
            for (const [word, def] of Object.entries(data)) {
                this.definitions.set(word.toUpperCase(), def);
            }
            console.log(`Loaded ${this.definitions.size} definitions`);
        } catch (err) {
            console.error(`Failed to load definitions ${url}`, err);
        }
    }

    clear(): void {
        this.dictionaries.clear();
    }

    /**
     * Checks if a word exists in any dictionary, prioritizing the given language.
     * Returns the language code of the match, or null if no match found.
     */
    checkWord(word: string, priorityLang?: string): string | null {
        const upper = word.toUpperCase();

        // 1. Check priority language first
        if (priorityLang && this.dictionaries.has(priorityLang)) {
            if (this.dictionaries.get(priorityLang)!.has(upper)) {
                return priorityLang;
            }
        }

        // 2. Check other languages
        for (const [lang, set] of this.dictionaries) {
            if (lang !== priorityLang && set.has(upper)) {
                return lang;
            }
        }

        return null;
    }

    getDefinition(word: string) {
        return this.definitions.get(word.toUpperCase()) || null;
    }

    // Legacy method for compatibility if needed, but we should migrate to checkWord
    isValidWord(word: string): boolean {
        return this.checkWord(word) !== null;
    }
}
