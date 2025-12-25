import { BootScene } from './BootScene';
import { SetupScene } from './SetupScene';
import { GameScene } from './GameScene';
import { SummaryScene } from './SummaryScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'app',
    backgroundColor: '#020202',
    scene: [BootScene, SetupScene, GameScene, SummaryScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);
