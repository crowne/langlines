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
        const bottomOffset = height * 0.15; // 15% bottom margin for UI
        const availableWidth = width - (padding * 2);
        const availableHeight = height - topOffset - bottomOffset - padding;

        // Calculate size based on the smaller dimension to ensure fit
        const tileSize = Math.min(
            Math.floor(availableWidth / 8),
            Math.floor(availableHeight / 8)
        );

        // Center the grid
        const gridWidth = tileSize * 8;
        const gridHeight = tileSize * 8;
        const gridStartX = (width - gridWidth) / 2 + (tileSize / 2);

        // Vertical centering within the available space between top and bottom panels
        const availableVerticalSpace = height - topOffset - bottomOffset;
        const verticalPadding = (availableVerticalSpace - gridHeight) / 2;
        const gridStartY = topOffset + verticalPadding + (tileSize / 2);

        this.createTopPanel(width, topOffset);
        this.createBottomPanel(width, height); // Use remaining space if needed

        this.grid = new Grid(
            this,
            8,
            8,
            tileSize,
            (word: string) => this.handleWordSelection(word),
            (word: string) => this.updateTopPanel(word)
        );
        this.grid.create(gridStartX, gridStartY);
    }

    private topText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private currentScore = 0;

    private createTopPanel(width: number, height: number) {
        this.add.rectangle(width / 2, height / 2, width, height, 0x333333);

        // Word Display
        this.topText = this.add.text(width / 2, height * 0.6, '', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Score
        this.scoreText = this.add.text(width - 20, 20, 'Score: 0', {
            fontSize: '24px',
            color: '#aaaaaa',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);
    }

    private createBottomPanel(width: number, height: number) {
        const panelHeight = height * 0.15;
        const y = height - (panelHeight / 2);

        this.add.rectangle(width / 2, y, width, panelHeight, 0x333333);

        // Shuffle Button (Placeholder)
        const btn = this.add.text(width / 2, y, 'SHUFFLE', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#555555',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', () => console.log('Shuffle clicked'));
    }

    private updateTopPanel(word: string) {
        if (word.length >= 3) {
            const isValid = this.wordLogic.isValidWord(word);
            if (isValid) {
                const score = word.length;
                this.topText.setText(`${word} (+${score})`);
                this.topText.setColor('#00ff00');
            } else {
                this.topText.setText(word);
                this.topText.setColor('#ffffff');
            }
        } else {
            this.topText.setText(word);
            this.topText.setColor('#ffffff');
        }
    }

    private handleWordSelection(word: string) {
        const isValid = this.wordLogic.isValidWord(word);
        console.log(`Selected word: ${word}, Valid: ${isValid}`);

        if (isValid) {
            // Scoring: 1 point per letter
            const score = word.length;
            this.currentScore += score;
            this.scoreText.setText(`Score: ${this.currentScore}`);

            // Flash feedback and apply gravity
            this.cameras.main.flash(200, 0, 255, 0);
            this.grid.handleMatch();
        } else {
            this.cameras.main.shake(100, 0.01);
        }
    }

    update() {
        // Game loop updates if needed
    }
}
