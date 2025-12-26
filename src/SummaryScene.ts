import Phaser from 'phaser';
import { themeManager } from './ThemeManager';

export interface RoundResult {
    round: number;
    score: number;
    foundWords: {
        word: string,
        lang: string,
        score: number,
        def?: string,
        translation?: string,
        transDef?: string
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
        const palette = themeManager.getPalette();

        this.add.rectangle(width / 2, height / 2, width, height, palette.background);

        const title = this.result.goalMet ? 'GOAL MET!' : 'ROUND FAILED';
        const titleColor = this.result.goalMet ? palette.match : palette.error;

        const titleTxt = this.add.text(width / 2, 50, title, {
            fontSize: '48px',
            color: titleColor,
            fontFamily: 'Outfit',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        titleTxt.setShadow(2, 2, '#000000', 2, true, true);

        this.add.text(width / 2, 110, `Round ${this.result.round} Summary`, {
            fontSize: '24px',
            color: palette.text,
            fontFamily: 'Outfit'
        }).setOrigin(0.5);

        // Stats
        const statsY = 180;
        const totalScoreTxt = this.add.text(width / 2, statsY, `Score: 0`, {
            fontSize: '20px',
            color: palette.text,
            fontFamily: 'Outfit'
        }).setOrigin(0.5);

        const scoreObj = { val: 0 };
        this.tweens.add({
            targets: scoreObj,
            val: this.result.score,
            duration: 1000,
            ease: 'Power2',
            onUpdate: () => {
                totalScoreTxt.setText(`Score: ${Math.floor(scoreObj.val)}`);
            }
        });

        this.add.text(width / 2, statsY + 30, `Lines Cleared: ${this.result.linesCleared} / ${this.result.round}`, {
            fontSize: '20px',
            color: palette.textSecondary,
            fontFamily: 'Outfit'
        }).setOrigin(0.5);

        // Word List Setup
        const listHeader = this.add.text(width / 2, statsY + 70, 'Words Found:', {
            fontSize: '24px',
            color: palette.text,
            fontFamily: 'Outfit',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const listAreaY = listHeader.y + 30;
        const listAreaHeight = height - listAreaY - 120; // Space for buttons
        const wrapWidth = width * 0.8;

        // Container for scrollable content
        const listContainer = this.add.container(0, 0);

        let currentY = 0;
        this.result.foundWords.forEach((w, index) => {
            const langCode = w.lang.toUpperCase();
            const scoreText = `(+${w.score})`;

            // Item Container for staggered fade-in
            const itemContainer = this.add.container(0, currentY);
            itemContainer.setAlpha(0);
            listContainer.add(itemContainer);

            let localY = 0;

            // 1. Word Line
            const wordTxt = this.add.text(width / 2, localY, `${w.word} (${langCode}) ${scoreText}`, {
                fontSize: '18px',
                color: palette.text,
                fontFamily: 'Outfit',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0);
            itemContainer.add(wordTxt);
            localY += 24;

            // 2. Primary Definition
            if (w.def) {
                const defTxt = this.add.text(width / 2, localY, w.def, {
                    fontSize: '14px',
                    color: palette.textSecondary,
                    fontFamily: 'Outfit',
                    align: 'center',
                    wordWrap: { width: wrapWidth }
                }).setOrigin(0.5, 0);
                itemContainer.add(defTxt);
                localY += defTxt.height + 4;
            }

            // 3. Translation & Translation Definition
            if (w.translation) {
                const transLang = w.lang === this.result.homeLang ? this.result.learningLang.toUpperCase() : this.result.homeLang.toUpperCase();
                const transText = `→ ${w.translation} (${transLang})`;
                const transTxtObj = this.add.text(width / 2, localY, transText, {
                    fontSize: '15px',
                    color: palette.match, // Using match color for translations
                    fontFamily: 'Outfit',
                    fontStyle: 'bold'
                }).setOrigin(0.5, 0);
                itemContainer.add(transTxtObj);
                localY += 20;

                if (w.transDef) {
                    const transDefTxt = this.add.text(width / 2, localY, w.transDef, {
                        fontSize: '13px',
                        color: palette.textSecondary,
                        fontFamily: 'Outfit',
                        align: 'center',
                        wordWrap: { width: wrapWidth }
                    }).setOrigin(0.5, 0);
                    itemContainer.add(transDefTxt);
                    localY += transDefTxt.height + 15;
                } else {
                    localY += 10;
                }
            } else {
                localY += 15;
            }

            localY += 10; // Extra padding between items
            const itemHeight = localY;

            // Staggered Animation
            const targetY = itemContainer.y;
            itemContainer.y += 20; // Start slightly lower
            this.tweens.add({
                targets: itemContainer,
                alpha: 1,
                y: targetY,
                duration: 400,
                delay: 200 + (index * 100),
                ease: 'Power2'
            });

            currentY += itemHeight;
        });

        // Scrolling Logic
        const minY = listAreaY;
        const maxY = listAreaY - Math.max(0, currentY - listAreaHeight);
        listContainer.y = minY;

        let isDragging = false;
        let dragStartY = 0;
        let containerStartY = 0;

        // Mask
        const maskShape = this.make.graphics({});
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(0, listAreaY, width, listAreaHeight);
        const mask = maskShape.createGeometryMask();
        listContainer.setMask(mask);

        // Input: Mouse Wheel
        this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number) => {
            listContainer.y = Phaser.Math.Clamp(listContainer.y - deltaY, maxY, minY);
        });

        // Input: Drag
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.y > listAreaY && pointer.y < listAreaY + listAreaHeight) {
                isDragging = true;
                dragStartY = pointer.y;
                containerStartY = listContainer.y;
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (isDragging && pointer.isDown) {
                const diff = pointer.y - dragStartY;
                listContainer.y = Phaser.Math.Clamp(containerStartY + diff, maxY, minY);
            }
        });

        this.input.on('pointerup', () => {
            isDragging = false;
        });

        // Buttons
        const buttonY = height - 80;
        const buttonStyle = {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Outfit',
            backgroundColor: themeManager.getMode() === 'dark' ? '#444444' : '#888888',
            padding: { x: 20, y: 10 }
        };

        const i18n = this.cache.json.get(`i18n-${this.result.homeLang}`) || {};
        const nextLabel = i18n.summary?.next || 'NEXT ROUND';
        const retryLabel = i18n.summary?.retry || 'RETRY';
        const homeLabel = i18n.summary?.home || 'HOME';

        if (this.result.goalMet) {
            const nextBtn = this.add.text(width / 2, buttonY, nextLabel, buttonStyle).setOrigin(0.5);
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
            const retryBtn = this.add.text(width / 2 - 100, buttonY, retryLabel, buttonStyle).setOrigin(0.5);
            retryBtn.setInteractive({ useHandCursor: true });
            retryBtn.on('pointerdown', () => {
                this.scene.start('GameScene', {
                    homeLang: this.result.homeLang,
                    learningLang: this.result.learningLang,
                    round: this.result.round,
                    score: 0
                });
            });

            const homeBtn = this.add.text(width / 2 + 100, buttonY, homeLabel, buttonStyle).setOrigin(0.5);
            homeBtn.setInteractive({ useHandCursor: true });
            homeBtn.on('pointerdown', () => {
                this.scene.start('SetupScene');
            });
        }
    }
}
