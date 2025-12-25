export class WordLogic {
    private words: Set<string>;

    constructor() {
        this.words = new Set();
    }

    async loadDictionary(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(response => response.json())
                .then((data: string[]) => {
                    data.forEach(word => this.words.add(word));
                    console.log(`Loaded ${this.words.size} words from ${url}`);
                    resolve();
                })
                .catch(err => {
                    console.error('Failed to load dictionary', err);
                    reject(err);
                });
        });
    }

    isValidWord(word: string): boolean {
        return this.words.has(word.toUpperCase());
    }
}
