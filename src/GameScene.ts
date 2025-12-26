import Phaser from 'phaser';
import { Grid } from './Grid';
import { WordLogic } from './WordLogic';
import { themeManager } from './ThemeManager';

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

    private topText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private goalText!: Phaser.GameObjects.Text;
    private finishBtn!: Phaser.GameObjects.Text;
    private currentScore = 0;
    private currentRound = 1;
    private foundWords: {
        word: string,
        lang: string,
        score: number,
        def?: string,
        translation?: string,
        transDef?: string
    }[] = [];
    private timeRemaining = 180; // 3 minutes
    private timerEvent!: Phaser.Time.TimerEvent;

    constructor() {
        super('GameScene');
        this.wordLogic = new WordLogic();
    }

    init(data: { homeLang: string, learningLang: string, round?: number, score?: number }) {
        if (data && data.homeLang) {
            this.homeLang = data.homeLang;
            this.learningLang = data.learningLang;
            this.currentRound = data.round || 1;
            this.currentScore = data.score || 0;
            this.foundWords = []; // Reset word list for the new round
        }
    }

    preload() {
        // Load assets here
        this.load.setBaseURL('./');
        this.load.json('i18n', `data/i18n/${this.homeLang}.json`);
    }

    async create() {
        // Load Dictionaries for both languages
        try {
            await this.wordLogic.loadDictionary(`data/lang_${this.homeLang}.json`, this.homeLang);
            await this.wordLogic.loadDictionary(`data/lang_${this.learningLang}.json`, this.learningLang);
            console.log('Structured dictionaries loaded');
        } catch (e) {
            console.error('Error loading data:', e);
        }

        const { width, height } = this.scale;
        const palette = themeManager.getPalette();

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, palette.background);

        // Calculate grid size based on available space (width vs height)
        const padding = 20;
        const topOffset = height * 0.20; // 20% top margin for UI
        const bottomOffset = height * 0.15; // 15% bottom margin for UI
        const availableWidth = width - (padding * 2);
        const availableHeight = height - topOffset - bottomOffset - padding;

        const tileSize = Math.min(
            Math.floor(availableWidth / 8),
            Math.floor(availableHeight / 8)
        );

        const gridWidth = tileSize * 8;
        const gridHeight = tileSize * 8;
        const gridStartX = (width - gridWidth) / 2 + (tileSize / 2);

        const availableVerticalSpace = height - topOffset - bottomOffset;
        const verticalPadding = (availableVerticalSpace - gridHeight) / 2;
        const gridStartY = topOffset + verticalPadding + (tileSize / 2);

        this.createTopPanel(width, topOffset);
        this.createBottomPanel(width, height);

        this.grid = new Grid(
            this,
            8,
            8,
            tileSize,
            (word: string, multipliers: number[]) => this.handleWordSelection(word, multipliers),
            (word: string, multipliers: number[]) => this.updateTopPanel(word, multipliers)
        );
        this.grid.create(gridStartX, gridStartY);

        this.startTimer();
        this.updateScoreDisplay();
        this.updateGoalDisplay();
    }

    private updateScoreDisplay() {
        const palette = themeManager.getPalette();
        const i18n = this.cache.json.get('i18n');
        const scoreLabel = i18n?.game?.score || 'Score';
        this.scoreText.setText(`${scoreLabel}: ${this.currentScore}`);
        this.scoreText.setColor(palette.textSecondary);
    }

    private updateGoalDisplay() {
        const palette = themeManager.getPalette();
        const i18n = this.cache.json.get('i18n');
        const goalLabel = i18n?.game?.goal || 'Goal';
        const linesLabel = i18n?.game?.lines || 'Lines';
        const lineLabel = i18n?.game?.line || 'Line';

        const targetLines = this.currentRound;
        const currentProgress = this.grid ? this.grid.getLinesCleared() : 0;
        const lineText = targetLines === 1 ? lineLabel : linesLabel;

        this.goalText.setText(`${goalLabel}: ${currentProgress} / ${targetLines} ${lineText}`);

        if (currentProgress >= targetLines) {
            this.goalText.setColor(palette.match);
            if (this.finishBtn) this.finishBtn.setVisible(true);
        } else {
            this.goalText.setColor(themeManager.getMode() === 'dark' ? '#ffff00' : '#888800');
            if (this.finishBtn) this.finishBtn.setVisible(false);
        }
    }

    private createTopPanel(width: number, height: number) {
        const palette = themeManager.getPalette();
        this.add.rectangle(width / 2, height / 2, width, height, palette.panel);

        // Word Display
        this.topText = this.add.text(width / 2, height * 0.45, '', {
            fontSize: '48px',
            color: palette.text,
            fontFamily: 'Outfit',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.topText.setShadow(2, 2, '#000000', 2, true, true);

        const i18n = this.cache.json.get('i18n');

        // Round Goal Text
        this.goalText = this.add.text(width / 2, 15, '', {
            fontSize: '20px',
            color: '#ffff00',
            fontFamily: 'Outfit',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0);
        this.goalText.setShadow(1, 1, '#000000', 1, true, true);

        const scoreLabel = i18n?.game?.score || 'Score';

        // Score
        this.scoreText = this.add.text(width - 20, 15, `${scoreLabel}: 0`, {
            fontSize: '24px',
            color: palette.textSecondary,
            fontFamily: 'Outfit'
        }).setOrigin(1, 0);
        this.scoreText.setShadow(1, 1, '#000000', 1, true, true);

        const timerLabel = i18n?.game?.timer || 'Time';

        // Timer
        this.timerText = this.add.text(20, 15, `${timerLabel}: 03:00`, {
            fontSize: '24px',
            color: palette.textSecondary,
            fontFamily: 'Outfit'
        }).setOrigin(0, 0);
        this.timerText.setShadow(1, 1, '#000000', 1, true, true);

        // Finish Round Button
        const finishLabel = i18n?.game?.btn?.finish || 'FINISH';
        this.finishBtn = this.add.text(width / 2, height - 35, finishLabel, {
            fontSize: '20px',
            color: '#ffffff',
            backgroundColor: palette.match,
            fontFamily: 'Outfit',
            padding: { x: 10, y: 5 },
            fontStyle: 'bold'
        }).setOrigin(0.5, 0).setVisible(false);
        this.finishBtn.setInteractive({ useHandCursor: true });
        this.finishBtn.on('pointerdown', () => this.handleTimeUp());
    }

    private createBottomPanel(width: number, height: number) {
        const palette = themeManager.getPalette();
        const panelHeight = height * 0.15;
        const y = height - (panelHeight / 2);

        this.add.rectangle(width / 2, y, width, panelHeight, palette.panel);

        const i18n = this.cache.json.get('i18n');
        const gridLabel = i18n?.game?.btn?.grid || 'GRID';
        const shuffleLabel = i18n?.game?.btn?.shuffle || 'SHUFFLE';
        const dictLabel = i18n?.game?.btn?.dict || 'DICT';

        const buttonStyle = {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: themeManager.getMode() === 'dark' ? '#555555' : '#888888',
            padding: { x: 15, y: 10 }
        };

        // Grid Reload Button
        const gridBtn = this.add.text(width / 2 - 140, y, gridLabel, buttonStyle).setOrigin(0.5);
        gridBtn.setInteractive({ useHandCursor: true });
        gridBtn.on('pointerdown', () => this.grid.reloadGrid());

        // Shuffle Button
        const shuffleBtn = this.add.text(width / 2, y, shuffleLabel, buttonStyle).setOrigin(0.5);
        shuffleBtn.setInteractive({ useHandCursor: true });
        shuffleBtn.on('pointerdown', () => this.grid.shuffleTiles());

        // Dict Reload Button
        const dictBtn = this.add.text(width / 2 + 140, y, dictLabel, buttonStyle).setOrigin(0.5);
        dictBtn.setInteractive({ useHandCursor: true });
        dictBtn.on('pointerdown', () => this.reloadDictionaries());
    }

    private startTimer() {
        this.timeRemaining = 180;
        this.updateTimerDisplay();

        if (this.timerEvent) this.timerEvent.destroy();

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    private updateTimer() {
        this.timeRemaining--;
        this.updateTimerDisplay();

        if (this.timeRemaining <= 0) {
            this.handleTimeUp();
        }
    }

    private updateTimerDisplay() {
        const i18n = this.cache.json.get('i18n');
        const timerLabel = i18n?.game?.timer || 'Time';

        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.timerText.setText(`${timerLabel}: ${timeString}`);

        if (this.timeRemaining <= 10) {
            this.timerText.setColor('#ff0000');
        } else {
            this.timerText.setColor('#aaaaaa');
        }
    }

    private handleTimeUp() {
        if (this.timerEvent) this.timerEvent.destroy();
        this.grid.setInteractive(false);

        const linesCleared = this.grid.getLinesCleared();
        const goalMet = linesCleared >= this.currentRound;

        // foundWords is already enriched during handleWordSelection, 
        // but we can ensure transDef is filled here if not already.
        const finalizedWords = this.foundWords.map(w => {
            if (w.translation && !w.transDef) {
                // Determine translation language
                const transLang = w.lang === this.homeLang ? this.learningLang : this.homeLang;
                const transEntry = this.wordLogic.getEntry(w.translation, transLang);
                return { ...w, transDef: transEntry?.def || '' };
            }
            return w;
        });

        this.time.delayedCall(1500, () => {
            this.scene.start('SummaryScene', {
                round: this.currentRound,
                score: this.currentScore,
                foundWords: finalizedWords,
                linesCleared: linesCleared,
                goalMet: goalMet,
                homeLang: this.homeLang,
                learningLang: this.learningLang
            });
        });

        this.cameras.main.shake(500, 0.02);
    }

    private reloadDictionaries() {
        console.log('Reloading dictionaries...');
        this.wordLogic.clear();
        Promise.all([
            this.wordLogic.loadDictionary(`data/lang_${this.homeLang}.json`, this.homeLang),
            this.wordLogic.loadDictionary(`data/lang_${this.learningLang}.json`, this.learningLang)
        ]).then(() => {
            console.log('Dictionaries reloaded');
            // Flash a small feedback
            this.cameras.main.flash(100, 100, 100, 255);
        }).catch(e => console.error(e));
    }

    private updateTopPanel(word: string, multipliers: number[] = []) {
        if (word.length >= 3) {
            // Prioritize learning language match for preview
            const match = this.wordLogic.checkWord(word, this.learningLang);
            if (match) {
                const langMultiplier = (match.lang === this.learningLang) ? 3 : 1;
                const baseScore = word.length * langMultiplier;

                let totalScore = baseScore;
                let multString = '';
                multipliers.forEach(m => {
                    totalScore *= m;
                    multString += ` *${m}`;
                });

                const langCode = match.lang.toUpperCase();
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
        const match = this.wordLogic.checkWord(word, this.learningLang);
        console.log(`Selected word: ${word}, Match: ${match?.lang}, Multipliers: ${multipliers.join(',')}`);

        if (match) {
            // Scoring: 1 point per letter for home, 3 for learning
            const langMultiplier = (match.lang === this.learningLang) ? 3 : 1;
            const baseScore = word.length * langMultiplier;
            let totalScore = baseScore;
            multipliers.forEach(m => totalScore *= m);

            this.currentScore += totalScore;

            // Enrich found word with immediate definition and translation info
            const transLang = match.lang === this.homeLang ? this.learningLang : this.homeLang;
            const translation = match.entry.translations[transLang];

            this.foundWords.push({
                word: match.word,
                lang: match.lang,
                score: totalScore,
                def: match.entry.def,
                translation: translation
            });

            this.updateScoreDisplay();

            // Flash feedback and apply gravity
            this.cameras.main.flash(200, 0, 255, 0);

            // Floating Score Juice
            this.showScorePopup(totalScore);

            this.grid.handleMatch();

            // Update goal progress after a short delay to allow gravity to start
            this.time.delayedCall(500, () => {
                this.updateGoalDisplay();
                // Auto-finish if grid is empty
                if (this.grid.isGridEmpty()) {
                    console.log('Grid empty, finishing round...');
                    this.handleTimeUp();
                }
            });
        } else {
            this.cameras.main.shake(100, 0.01);

            // Top text shake for error
            this.tweens.add({
                targets: this.topText,
                x: this.topText.x + 10,
                duration: 50,
                yoyo: true,
                repeat: 2
            });
        }
    }

    private showScorePopup(score: number) {
        const { width, height } = this.scale;
        const popup = this.add.text(width / 2, height * 0.45, `+${score}`, {
            fontSize: '64px',
            color: '#ffff00',
            fontFamily: 'Outfit',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        popup.setShadow(2, 2, '#000000', 2, true, true);

        this.tweens.add({
            targets: popup,
            y: popup.y - 100,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => popup.destroy()
        });
    }

    update() {
        // Game loop updates if needed
    }
}
