export interface WordEntry {
    def: string;
    translations: Record<string, string>;
}

export class WordLogic {
    private dictionaries: Map<string, Record<string, WordEntry>>;

    constructor() {
        this.dictionaries = new Map();
    }

    async loadDictionary(url: string, lang: string): Promise<void> {
        try {
            const response = await fetch(url);
            const data: Record<string, WordEntry> = await response.json();

            // Normalize keys to uppercase for reliable matching
            const normalized: Record<string, WordEntry> = {};
            for (const [key, value] of Object.entries(data)) {
                normalized[key.toUpperCase()] = value;
            }

            this.dictionaries.set(lang, normalized);
            console.log(`Loaded ${Object.keys(normalized).length} words from ${url} for lang: ${lang}`);
        } catch (err) {
            console.error(`Failed to load dictionary ${url}`, err);
            throw err;
        }
    }

    clear(): void {
        this.dictionaries.clear();
    }

    /**
     * Checks if a word exists in any dictionary, prioritizing the given language.
     * Returns an object with lang and the full entry, or null if no match found.
     */
    checkWord(word: string, priorityLang?: string): { lang: string, entry: WordEntry, word: string } | null {
        const upper = word.toUpperCase();

        // 1. Check priority language first
        if (priorityLang && this.dictionaries.has(priorityLang)) {
            const dict = this.dictionaries.get(priorityLang)!;
            if (dict[upper]) {
                return { lang: priorityLang, entry: dict[upper], word: upper };
            }
        }

        // 2. Check other languages
        for (const [lang, dict] of this.dictionaries) {
            if (lang !== priorityLang && dict[upper]) {
                return { lang, entry: dict[upper], word: upper };
            }
        }

        return null;
    }

    /**
     * Look up a word in a specific language's dictionary.
     */
    getEntry(word: string, lang: string): WordEntry | null {
        const dict = this.dictionaries.get(lang);
        if (!dict) return null;
        return dict[word.toUpperCase()] || null;
    }

    getDefinition(word: string, lang?: string) {
        if (lang) {
            return this.getEntry(word, lang)?.def || null;
        }
        // Fallback search across all loaded dicts
        for (const dict of this.dictionaries.values()) {
            if (dict[word.toUpperCase()]) return dict[word.toUpperCase()].def;
        }
        return null;
    }

    // Legacy method for compatibility if needed, but we should migrate to checkWord
    isValidWord(word: string): boolean {
        return this.checkWord(word) !== null;
    }
}
