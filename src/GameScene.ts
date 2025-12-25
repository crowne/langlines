import Phaser from 'phaser';
import { Grid } from './Grid';
import { WordLogic } from './WordLogic';

export class GameScene extends Phaser.Scene {
    private grid!: Grid;
    private wordLogic: WordLogic;

    constructor() {
        super('GameScene');
        this.wordLogic = new WordLogic();
    }

    preload() {
        // Load assets here
        this.load.setBaseURL('./');
        // We will likely generate textures programmatically for now to save time/assets
    }

    create() {
        // Load Dictionary
        this.wordLogic.loadDictionary('data/en.json')
            .then(() => console.log('Dictionary loaded'))
            .catch(e => console.error(e));

        const { width, height } = this.scale;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x222222);

        // Calculate grid size based on screen width (portrait mode mostly)
        // Leave some padding
        const padding = 20;
        const availableWidth = width - (padding * 2);
        const tileSize = Math.floor(availableWidth / 8);

        const gridStartX = padding + (tileSize / 2);
        const gridStartY = height * 0.2 + (tileSize / 2);

        this.grid = new Grid(this, 8, 8, tileSize, (word: string) => this.handleWordSelection(word));
        this.grid.create(gridStartX, gridStartY);
    }

    private handleWordSelection(word: string) {
        const isValid = this.wordLogic.isValidWord(word);
        console.log(`Selected word: ${word}, Valid: ${isValid}`);
        // Todo: If valid, score it and remove tiles
    }

    update() {
        // Game loop updates if needed
    }
}
