import Phaser from 'phaser';

export class SetupScene extends Phaser.Scene {
    private homeLang: string = 'en';
    private learningLang: string = 'es';

    private labels: { [key: string]: { [key: string]: string } } = {
        en: {
            title: 'LANG-LINES',
            select: 'Select Your Languages',
            home: 'Home: English',
            learning: 'Learning: Spanish',
            start: 'START GAME'
        },
        es: {
            title: 'LINGUA-LÍNEAS',
            select: 'Selecciona tus idiomas',
            home: 'Hogar: Español',
            learning: 'Aprendiendo: Inglés',
            start: 'EMPEZAR JUEGO'
        }
    };

    private titleText!: Phaser.GameObjects.Text;
    private selectText!: Phaser.GameObjects.Text;
    private homeBtn!: Phaser.GameObjects.Text;
    private learningBtn!: Phaser.GameObjects.Text;
    private startBtnContainer!: Phaser.GameObjects.Container;
    private startBtnGraphics!: Phaser.GameObjects.Graphics;
    private startBtnText!: Phaser.GameObjects.Text;

    constructor() {
        super('SetupScene');
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, 0x222222);

        // Title
        this.titleText = this.add.text(width / 2, height * 0.2, '', {
            fontSize: '64px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.selectText = this.add.text(width / 2, height * 0.3, '', {
            fontSize: '32px',
            color: '#aaaaaa',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Language Buttons
        this.homeBtn = this.createLangButton(width / 2, height * 0.5, '', () => this.toggleHomeLang());
        this.learningBtn = this.createLangButton(width / 2, height * 0.6, '', () => this.toggleLearningLang());

        // Start Button Container
        this.startBtnContainer = this.add.container(width / 2, height * 0.8);

        this.startBtnGraphics = this.add.graphics();
        this.startBtnText = this.add.text(0, 0, '', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.startBtnContainer.add([this.startBtnGraphics, this.startBtnText]);

        // Hit area for the container or a hidden rectangle
        const hitArea = this.add.rectangle(0, 0, 400, 100, 0x000000, 0);
        hitArea.setName('hitArea');
        this.startBtnContainer.add(hitArea);

        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => {
            this.scene.start('GameScene', {
                homeLang: this.homeLang,
                learningLang: this.learningLang
            });
        });

        // Hover effect for the graphics
        hitArea.on('pointerover', () => this.drawStartButton(true));
        hitArea.on('pointerout', () => this.drawStartButton(false));

        this.updateLabels();
    }

    private toggleHomeLang() {
        this.homeLang = this.homeLang === 'en' ? 'es' : 'en';
        // Ensure learning lang is different
        if (this.homeLang === this.learningLang) {
            this.learningLang = this.homeLang === 'en' ? 'es' : 'en';
        }
        this.updateLabels();
    }

    private toggleLearningLang() {
        this.learningLang = this.learningLang === 'en' ? 'es' : 'en';
        // Ensure home lang is different
        if (this.learningLang === this.homeLang) {
            this.homeLang = this.learningLang === 'en' ? 'es' : 'en';
        }
        this.updateLabels();
    }

    private updateLabels() {
        if (!this.titleText) return;

        const l = this.labels[this.homeLang];
        this.titleText.setText(l.title);
        this.selectText.setText(l.select);
        this.homeBtn.setText(this.labels[this.homeLang].home);
        this.learningBtn.setText(this.labels[this.homeLang].learning);
        this.startBtnText.setText(l.start);

        this.drawStartButton(false);
    }

    private drawStartButton(isHover: boolean) {
        if (!this.startBtnGraphics || !this.startBtnText) return;

        const padding = 80;
        const btnWidth = Math.max(400, this.startBtnText.width + padding);
        const btnHeight = 100;

        this.startBtnGraphics.clear();
        this.startBtnGraphics.fillStyle(isHover ? 0x7c84ff : 0x646cff, 1);
        this.startBtnGraphics.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);

        // Update hit area size too
        const hitArea = this.startBtnContainer.getByName('hitArea') as Phaser.GameObjects.Rectangle;
        if (hitArea) {
            hitArea.setSize(btnWidth, btnHeight);
        }
    }

    private createLangButton(x: number, y: number, text: string, callback: () => void) {
        const btn = this.add.text(x, y, text, {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', callback);
        return btn;
    }
}
