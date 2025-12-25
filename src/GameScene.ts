import Phaser from 'phaser';
import { Grid } from './Grid';
import { WordLogic } from './WordLogic';

/**
 * The main game scene.
 * |-----------------------------------|
 * | [home]       topPanel    score: 0 |
 * |    WORD (EN) +3 * 2 * 3 = 18      |
 * |-----------------------------------|
 * | grid                              |
 * |-----------------------------------|
 * |         bottomPanel               |
 * | [grid reload] [shuffle] [dict]    |
 * |-----------------------------------|
 */
export class GameScene extends Phaser.Scene {
    private grid!: Grid;
    private wordLogic: WordLogic;

    private homeLang: string = 'en';
    private learningLang: string = 'es';

    constructor() {
        super('GameScene');
        this.wordLogic = new WordLogic();
    }

    init(data: { homeLang: string, learningLang: string }) {
        if (data && data.homeLang) {
            this.homeLang = data.homeLang;
            this.learningLang = data.learningLang;
        }
    }

    preload() {
        // Load assets here
        this.load.setBaseURL('./');
        this.load.json('i18n', `data/i18n/${this.homeLang}.json`);
    }

    create() {
        // Load Dictionaries for both languages
        Promise.all([
            this.wordLogic.loadDictionary(`data/${this.homeLang}.json`, this.homeLang),
            this.wordLogic.loadDictionary(`data/${this.learningLang}.json`, this.learningLang)
        ]).then(() => console.log('Dictionaries loaded'))
            .catch(e => console.error('Error loading dictionaries:', e));

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
            (word: string, multipliers: number[]) => this.handleWordSelection(word, multipliers),
            (word: string, multipliers: number[]) => this.updateTopPanel(word, multipliers)
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

        const i18n = this.cache.json.get('i18n');
        const scoreLabel = i18n?.game?.score || 'Score';

        // Score
        this.scoreText = this.add.text(width - 20, 20, `${scoreLabel}: 0`, {
            fontSize: '24px',
            color: '#aaaaaa',
            fontFamily: 'Arial'
        }).setOrigin(1, 0);
    }

    private createBottomPanel(width: number, height: number) {
        const panelHeight = height * 0.15;
        const y = height - (panelHeight / 2);

        this.add.rectangle(width / 2, y, width, panelHeight, 0x333333);

        const i18n = this.cache.json.get('i18n');
        const gridLabel = i18n?.game?.btn?.grid || 'GRID';
        const shuffleLabel = i18n?.game?.btn?.shuffle || 'SHUFFLE';
        const dictLabel = i18n?.game?.btn?.dict || 'DICT';

        const buttonStyle = {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#555555',
            padding: { x: 15, y: 10 }
        };

        // Grid Reload Button (Left)
        const gridBtn = this.add.text(width / 2 - 140, y, gridLabel, buttonStyle).setOrigin(0.5);
        gridBtn.setInteractive({ useHandCursor: true });
        gridBtn.on('pointerdown', () => this.grid.reloadGrid());

        // Shuffle Button (Center)
        const shuffleBtn = this.add.text(width / 2, y, shuffleLabel, buttonStyle).setOrigin(0.5);
        shuffleBtn.setInteractive({ useHandCursor: true });
        shuffleBtn.on('pointerdown', () => this.grid.shuffleTiles());

        // Dict Reload Button (Right)
        const dictBtn = this.add.text(width / 2 + 140, y, dictLabel, buttonStyle).setOrigin(0.5);
        dictBtn.setInteractive({ useHandCursor: true });
        dictBtn.on('pointerdown', () => this.reloadDictionaries());
    }

    private reloadDictionaries() {
        console.log('Reloading dictionaries...');
        this.wordLogic.clear();
        Promise.all([
            this.wordLogic.loadDictionary(`data/${this.homeLang}.json`, this.homeLang),
            this.wordLogic.loadDictionary(`data/${this.learningLang}.json`, this.learningLang)
        ]).then(() => {
            console.log('Dictionaries reloaded');
            // Flash a small feedback
            this.cameras.main.flash(100, 100, 100, 255);
        }).catch(e => console.error(e));
    }

    private updateTopPanel(word: string, multipliers: number[] = []) {
        if (word.length >= 3) {
            // Prioritize learning language match for preview
            const matchLang = this.wordLogic.checkWord(word, this.learningLang);
            if (matchLang) {
                const langMultiplier = (matchLang === this.learningLang) ? 3 : 1;
                const baseScore = word.length * langMultiplier;

                let totalScore = baseScore;
                let multString = '';
                multipliers.forEach(m => {
                    totalScore *= m;
                    multString += ` *${m}`;
                });

                const langCode = matchLang.toUpperCase();
                const scoreDisplay = multipliers.length > 0 ? `+${baseScore}${multString} = ${totalScore}` : `+${baseScore}`;

                this.topText.setText(`${word} (${langCode}) ${scoreDisplay}`);
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

    private handleWordSelection(word: string, multipliers: number[] = []) {
        // Prioritize learning language match
        const matchLang = this.wordLogic.checkWord(word, this.learningLang);
        console.log(`Selected word: ${word}, Match: ${matchLang}, Multipliers: ${multipliers.join(',')}`);

        if (matchLang) {
            // Scoring: 1 point per letter for home, 3 for learning
            const langMultiplier = (matchLang === this.learningLang) ? 3 : 1;
            const baseScore = word.length * langMultiplier;
            let totalScore = baseScore;
            multipliers.forEach(m => totalScore *= m);

            this.currentScore += totalScore;
            const i18n = this.cache.json.get('i18n');
            const scoreLabel = i18n?.game?.score || 'Score';
            this.scoreText.setText(`${scoreLabel}: ${this.currentScore}`);

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
