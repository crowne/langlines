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

        // Calculate grid size based on available space (width vs height)
        const padding = 20;
        const topOffset = height * 0.15; // 15% top margin for UI
        const availableWidth = width - (padding * 2);
        const availableHeight = height - topOffset - padding;

        // Calculate size based on the smaller dimension to ensure fit
        const tileSize = Math.min(
            Math.floor(availableWidth / 8),
            Math.floor(availableHeight / 8)
        );

        // Center the grid
        const gridWidth = tileSize * 8;
        // const gridHeight = tileSize * 8;
        const gridStartX = (width - gridWidth) / 2 + (tileSize / 2);
        // Start Y includes the offset and half tile for centering
        const gridStartY = topOffset + (tileSize / 2);

        this.grid = new Grid(this, 8, 8, tileSize, (word: string) => this.handleWordSelection(word));
        this.grid.create(gridStartX, gridStartY);
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
