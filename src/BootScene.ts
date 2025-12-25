import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Load any core assets here (e.g. logos, common UI elements)
        // For now, we use programmatically generated graphics.
    }

    create() {
        this.scene.start('SetupScene');
    }
}
