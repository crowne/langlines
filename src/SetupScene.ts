import Phaser from 'phaser';
import { themeManager } from './ThemeManager';

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
    private themeBtn!: Phaser.GameObjects.Text;

    constructor() {
        super('SetupScene');
    }

    create() {
        const { width, height } = this.scale;
        const palette = themeManager.getPalette();

        // Background
        this.add.rectangle(width / 2, height / 2, width, height, palette.background);

        // Theme Toggle
        const themeIcon = themeManager.getMode() === 'light' ? '🌙' : '☀️';
        this.themeBtn = this.add.text(width - 30, 30, themeIcon, {
            fontSize: '32px',
            padding: { top: 10, bottom: 10, left: 10, right: 10 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

        this.themeBtn.on('pointerdown', () => this.toggleTheme());

        // Title
        this.titleText = this.add.text(width / 2, height * 0.2, '', {
            fontSize: '64px',
            color: palette.text,
            fontFamily: 'Outfit',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Floating Title Animation
        this.tweens.add({
            targets: this.titleText,
            y: height * 0.22,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            loop: -1
        });

        this.selectText = this.add.text(width / 2, height * 0.3, '', {
            fontSize: '32px',
            color: palette.textSecondary,
            fontFamily: 'Outfit'
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
            fontFamily: 'Outfit',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Pulsing Start Button Animation
        this.tweens.add({
            targets: this.startBtnContainer,
            scale: 1.05,
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            loop: -1
        });

        this.startBtnContainer.add([this.startBtnGraphics, this.startBtnText]);

        // Hit area for the container
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

        hitArea.on('pointerover', () => this.drawStartButton(true));
        hitArea.on('pointerout', () => this.drawStartButton(false));

        this.updateLabels();
    }

    private toggleTheme() {
        themeManager.toggleMode();
        this.scene.restart();
    }

    private toggleHomeLang() {
        this.homeLang = this.homeLang === 'en' ? 'es' : 'en';
        if (this.homeLang === this.learningLang) {
            this.learningLang = this.homeLang === 'en' ? 'es' : 'en';
        }
        this.updateLabels();
    }

    private toggleLearningLang() {
        this.learningLang = this.learningLang === 'en' ? 'es' : 'en';
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

        const palette = themeManager.getPalette();
        const padding = 80;
        const btnWidth = Math.max(400, this.startBtnText.width + padding);
        const btnHeight = 100;

        this.startBtnGraphics.clear();
        // Convert hex strings/numbers correctly. ThemeManager uses numbers for Graphics.
        this.startBtnGraphics.fillStyle(isHover ? palette.accentSecondary === '#7c84ff' ? 0x7c84ff : 0x5a62ff : palette.accent === '#646cff' ? 0x646cff : 0x3b43d6, 1);

        // Actually, let's update ThemeManager to have numeric values for accent colors too if possible, 
        // but for now I'll just use the Logic I already have or improve ThemeManager.
        // Wait, I define them as strings in ThemeManager.
        // Let's use a quick helper to convert hex string to number if needed, or just add numeric versions.

        const accentColor = isHover ?
            (themeManager.getMode() === 'dark' ? 0x7c84ff : 0x5a62ff) :
            (themeManager.getMode() === 'dark' ? 0x646cff : 0x3b43d6);

        this.startBtnGraphics.fillStyle(accentColor, 1);
        this.startBtnGraphics.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);

        const hitArea = this.startBtnContainer.getByName('hitArea') as Phaser.GameObjects.Rectangle;
        if (hitArea) {
            hitArea.setSize(btnWidth, btnHeight);
        }
    }

    private createLangButton(x: number, y: number, text: string, callback: () => void) {
        const btn = this.add.text(x, y, text, {
            fontSize: '28px',
            color: '#ffffff', // Keep white on language buttons as they have dark background
            fontFamily: 'Outfit',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        const isDark = themeManager.getMode() === 'dark';
        btn.setBackgroundColor(isDark ? '#444444' : '#888888');

        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerdown', callback);
        return btn;
    }
}
