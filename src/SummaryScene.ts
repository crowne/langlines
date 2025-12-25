import Phaser from 'phaser';

export interface RoundResult {
    round: number;
    score: number;
    foundWords: {
        word: string,
        lang: string,
        score: number,
        translation?: string,
        meaning?: string
    }[];
    linesCleared: number;
    goalMet: boolean;
    homeLang: string;
    learningLang: string;
}

export class SummaryScene extends Phaser.Scene {
    private result!: RoundResult;

    constructor() {
        super('SummaryScene');
    }

    init(data: RoundResult) {
        this.result = data;
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x222222);

        const title = this.result.goalMet ? 'GOAL MET!' : 'ROUND FAILED';
        const titleColor = this.result.goalMet ? '#00ff00' : '#ff0000';

        this.add.text(width / 2, 50, title, {
            fontSize: '48px',
            color: titleColor,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(width / 2, 110, `Round ${this.result.round} Summary`, {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Stats
        const statsY = 180;
        this.add.text(width / 2, statsY, `Score: ${this.result.score}`, { fontSize: '20px' }).setOrigin(0.5);
        this.add.text(width / 2, statsY + 30, `Lines Cleared: ${this.result.linesCleared} / ${this.result.round}`, { fontSize: '20px' }).setOrigin(0.5);

        // Word List
        this.add.text(width / 2, statsY + 80, 'Words Found:', { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);

        const listStartY = statsY + 110;
        const maxDisplay = 10;
        this.result.foundWords.slice(0, maxDisplay).forEach((w, i) => {
            const trans = w.translation ? ` [${w.translation}]` : '';
            const meaning = w.meaning ? ` - ${w.meaning}` : '';
            const display = `${w.word} (${w.lang.toUpperCase()})${trans}${meaning} (${w.score} pts)`;

            this.add.text(width / 2, listStartY + (i * 25), display, {
                fontSize: '16px',
                color: '#aaaaaa'
            }).setOrigin(0.5);
        });

        if (this.result.foundWords.length > maxDisplay) {
            this.add.text(width / 2, listStartY + (maxDisplay * 25), `... and ${this.result.foundWords.length - maxDisplay} more`, { fontSize: '16px', color: '#777777' }).setOrigin(0.5);
        }

        // Buttons
        const buttonY = height - 100;
        const buttonStyle = {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        };

        if (this.result.goalMet) {
            const nextBtn = this.add.text(width / 2, buttonY, 'NEXT ROUND', buttonStyle).setOrigin(0.5);
            nextBtn.setInteractive({ useHandCursor: true });
            nextBtn.on('pointerdown', () => {
                this.scene.start('GameScene', {
                    homeLang: this.result.homeLang,
                    learningLang: this.result.learningLang,
                    round: this.result.round + 1,
                    score: this.result.score
                });
            });
        } else {
            const retryBtn = this.add.text(width / 2 - 100, buttonY, 'RETRY', buttonStyle).setOrigin(0.5);
            retryBtn.setInteractive({ useHandCursor: true });
            retryBtn.on('pointerdown', () => {
                this.scene.start('GameScene', {
                    homeLang: this.result.homeLang,
                    learningLang: this.result.learningLang,
                    round: this.result.round,
                    score: 0 // Reset score on failure? Or keep? User said "back to Home/SetupScene"
                });
            });

            const homeBtn = this.add.text(width / 2 + 100, buttonY, 'EXIT', buttonStyle).setOrigin(0.5);
            homeBtn.setInteractive({ useHandCursor: true });
            homeBtn.on('pointerdown', () => {
                this.scene.start('SetupScene');
            });
        }
    }
}
