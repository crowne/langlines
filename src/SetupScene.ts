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
    private startBtnRect!: Phaser.GameObjects.Rectangle;
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

        this.startBtnRect = this.add.rectangle(0, 0, 400, 100, 0x646cff);
        this.startBtnText = this.add.text(0, 0, '', {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.startBtnContainer.add([this.startBtnRect, this.startBtnText]);

        this.startBtnRect.setInteractive({ useHandCursor: true });
        this.startBtnRect.on('pointerdown', () => {
            this.scene.start('GameScene', {
                homeLang: this.homeLang,
                learningLang: this.learningLang
            });
        });

        // Hover effect
        this.startBtnRect.on('pointerover', () => this.startBtnRect.setFillStyle(0x7c84ff));
        this.startBtnRect.on('pointerout', () => this.startBtnRect.setFillStyle(0x646cff));

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

        // Adjust start button border
        if (this.startBtnRect && this.startBtnText) {
            const padding = 80;
            const newWidth = Math.max(400, this.startBtnText.width + padding);
            this.startBtnRect.width = newWidth;
            // Since elements are in a container at (0,0), and origin is 0.5, 
            // they remain perfectly centered relative to the container's x.
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
