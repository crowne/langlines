import Phaser from 'phaser';

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

        // Word List Setup
        const listHeader = this.add.text(width / 2, statsY + 70, 'Words Found:', { fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);

        const listAreaY = listHeader.y + 30;
        const listAreaHeight = height - listAreaY - 120; // Space for buttons
        const wrapWidth = width * 0.8;

        // Container for scrollable content
        const listContainer = this.add.container(0, 0);

        let currentY = 0;
        this.result.foundWords.forEach((w) => {
            const langCode = w.lang.toUpperCase();
            const scoreText = `(+${w.score})`;

            // 1. Word Line
            const wordTxt = this.add.text(width / 2, currentY, `${w.word} (${langCode}) ${scoreText}`, {
                fontSize: '18px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5, 0);
            listContainer.add(wordTxt);
            currentY += 24;

            // 2. Primary Definition
            if (w.def) {
                const defTxt = this.add.text(width / 2, currentY, w.def, {
                    fontSize: '14px',
                    color: '#aaaaaa',
                    align: 'center',
                    wordWrap: { width: wrapWidth }
                }).setOrigin(0.5, 0);
                listContainer.add(defTxt);
                currentY += defTxt.height + 4;
            }

            // 3. Translation & Translation Definition
            if (w.translation) {
                const transLang = w.lang === this.result.homeLang ? this.result.learningLang.toUpperCase() : this.result.homeLang.toUpperCase();
                const transText = `→ ${w.translation} (${transLang})`;
                const transTxtObj = this.add.text(width / 2, currentY, transText, {
                    fontSize: '15px',
                    color: '#44aa44', // Subtle green for translation
                    fontStyle: 'bold'
                }).setOrigin(0.5, 0);
                listContainer.add(transTxtObj);
                currentY += 20;

                if (w.transDef) {
                    const transDefTxt = this.add.text(width / 2, currentY, w.transDef, {
                        fontSize: '13px',
                        color: '#888888',
                        align: 'center',
                        wordWrap: { width: wrapWidth }
                    }).setOrigin(0.5, 0);
                    listContainer.add(transDefTxt);
                    currentY += transDefTxt.height + 15;
                } else {
                    currentY += 10;
                }
            } else {
                currentY += 15;
            }

            currentY += 10; // Extra padding between items
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
                    score: 0
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
