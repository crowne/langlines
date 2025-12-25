import Phaser from 'phaser';

export class Grid {
    private scene: Phaser.Scene;
    private rows: number;
    private cols: number;
    private tileSize: number;
    private tiles: Phaser.GameObjects.Container[][];
    private letters: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    private selectedTiles: Phaser.GameObjects.Container[] = [];
    private onWordSelected: (word: string) => void;

    constructor(scene: Phaser.Scene, rows: number, cols: number, tileSize: number, onWordSelected: (word: string) => void) {
        this.scene = scene;
        this.rows = rows;
        this.cols = cols;
        this.tileSize = tileSize;
        this.tiles = [];
        this.onWordSelected = onWordSelected;
    }

    create(startX: number, startY: number) {
        for (let row = 0; row < this.rows; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const x = startX + (col * this.tileSize);
                const y = startY + (row * this.tileSize);

                this.createTile(row, col, x, y);
            }
        }

        // Handle global input up to end selection even if off-tile
        this.scene.input.on('pointerup', () => this.endSelection());
    }

    private createTile(row: number, col: number, x: number, y: number) {
        const char = Phaser.Utils.Array.GetRandom(this.letters);

        const container = this.scene.add.container(x, y);

        // Tile Background - Make it interactive
        const rect = this.scene.add.rectangle(0, 0, this.tileSize - 4, this.tileSize - 4, 0xffffff);
        rect.setStrokeStyle(2, 0x000000);
        rect.setName('bg');

        // Letter
        const text = this.scene.add.text(0, 0, char, {
            fontSize: `${this.tileSize * 0.6}px`,
            color: '#000000',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        container.add([rect, text]);
        container.setData('letter', char);
        container.setData('row', row);
        container.setData('col', col);

        // Make container size match tile for interaction
        container.setSize(this.tileSize - 4, this.tileSize - 4);
        container.setInteractive();

        // Interaction
        container.on('pointerdown', () => this.startSelection(container));
        container.on('pointerover', () => this.updateSelection(container));

        this.tiles[row][col] = container;
    }

    private startSelection(tile: Phaser.GameObjects.Container) {
        this.selectedTiles = [tile];
        this.highlightTile(tile, true);
    }

    private updateSelection(tile: Phaser.GameObjects.Container) {
        if (this.selectedTiles.length > 0 && !this.selectedTiles.includes(tile)) {
            const lastTile = this.selectedTiles[this.selectedTiles.length - 1];
            // Simple adjacency check: row/col delta <= 1
            const dRow = Math.abs(tile.getData('row') - lastTile.getData('row'));
            const dCol = Math.abs(tile.getData('col') - lastTile.getData('col'));

            if (dRow <= 1 && dCol <= 1) {
                this.selectedTiles.push(tile);
                this.highlightTile(tile, true);
            }
        }
    }

    private endSelection() {
        if (this.selectedTiles.length > 0) {
            const word = this.selectedTiles.map(t => t.getData('letter')).join('');
            this.onWordSelected(word);

            // Reset visual
            this.selectedTiles.forEach(t => this.highlightTile(t, false));
            this.selectedTiles = [];
        }
    }

    private highlightTile(tile: Phaser.GameObjects.Container, isSelected: boolean) {
        const rect = tile.getByName('bg') as Phaser.GameObjects.Rectangle;
        if (rect) {
            rect.setFillStyle(isSelected ? 0xffff00 : 0xffffff);
        }
    }
}
