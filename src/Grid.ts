import Phaser from 'phaser';

export class Grid {
    private scene: Phaser.Scene;
    private rows: number;
    private cols: number;
    private tileSize: number;
    private tiles: (Phaser.GameObjects.Container | null)[][];
    private letters: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    private selectedTiles: Phaser.GameObjects.Container[] = [];
    private onWordSelected: (word: string) => void;
    private onSelectionUpdate: (word: string) => void;
    private startX: number = 0;
    private startY: number = 0;

    constructor(scene: Phaser.Scene, rows: number, cols: number, tileSize: number, onWordSelected: (word: string) => void, onSelectionUpdate: (word: string) => void) {
        this.scene = scene;
        this.rows = rows;
        this.cols = cols;
        this.tileSize = tileSize;
        this.tiles = [];
        this.onWordSelected = onWordSelected;
        this.onSelectionUpdate = onSelectionUpdate;
    }

    create(startX: number, startY: number) {
        this.startX = startX;
        this.startY = startY;
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

        // Tile Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0xffffff, 1);
        bg.fillRoundedRect(-this.tileSize / 2 + 2, -this.tileSize / 2 + 2, this.tileSize - 4, this.tileSize - 4, 8);
        bg.setName('bg');

        // Letter
        const text = this.scene.add.text(0, 0, char, {
            fontSize: `${this.tileSize * 0.5}px`,
            color: '#333333',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, text]);
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

    public handleMatch() {
        // Destroy selected tiles and null them in grid
        this.selectedTiles.forEach(tile => {
            const row = tile.getData('row');
            const col = tile.getData('col');
            this.tiles[row][col] = null;
            tile.destroy();
        });
        this.selectedTiles = [];
        this.onSelectionUpdate('');

        // Apply physics
        this.applyGravity(() => {
            this.shiftColumns(() => {
                // No refill as per user request
            });
        });
    }

    private applyGravity(onComplete: () => void) {
        let maxDuration = 0;
        let animatedAny = false;

        for (let col = 0; col < this.cols; col++) {
            let emptySpots = 0;
            // Iterate from bottom to top
            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.tiles[row][col] === null) {
                    emptySpots++;
                } else if (emptySpots > 0) {
                    // Move current tile down by emptySpots gaps
                    const tile = this.tiles[row][col]!;
                    const newRow = row + emptySpots;

                    this.tiles[newRow][col] = tile;
                    this.tiles[row][col] = null;
                    tile.setData('row', newRow);

                    const targetY = this.startY + (newRow * this.tileSize);
                    const duration = emptySpots * 100;
                    maxDuration = Math.max(maxDuration, duration);
                    animatedAny = true;

                    this.scene.tweens.add({
                        targets: tile,
                        y: targetY,
                        duration: duration,
                        ease: 'Bounce.easeOut'
                    });
                }
            }
        }

        if (animatedAny) {
            this.scene.time.delayedCall(maxDuration, onComplete);
        } else {
            onComplete();
        }
    }

    private shiftColumns(onComplete: () => void) {
        let animatedAny = false;
        let maxDuration = 0;

        // Check columns from right to left
        for (let col = this.cols - 1; col > 0; col--) {
            let isColumnEmpty = true;
            for (let row = 0; row < this.rows; row++) {
                if (this.tiles[row][col] !== null) {
                    isColumnEmpty = false;
                    break;
                }
            }

            if (isColumnEmpty) {
                // If this column is empty, we might need to shift left columns into it.
                // But if they are ALSO empty, we need to find the first non-empty column to the left.
                let sourceCol = -1;
                for (let c = col - 1; c >= 0; c--) {
                    let hasContent = false;
                    for (let r = 0; r < this.rows; r++) {
                        if (this.tiles[r][c] !== null) {
                            hasContent = true;
                            break;
                        }
                    }
                    if (hasContent) {
                        sourceCol = c;
                        break;
                    }
                }

                if (sourceCol !== -1) {
                    // Move the source column to this column
                    for (let row = 0; row < this.rows; row++) {
                        const tile = this.tiles[row][sourceCol];
                        if (tile) {
                            this.tiles[row][col] = tile;
                            this.tiles[row][sourceCol] = null;
                            tile.setData('col', col);

                            const targetX = this.startX + (col * this.tileSize);
                            maxDuration = Math.max(maxDuration, 200);
                            animatedAny = true;

                            this.scene.tweens.add({
                                targets: tile,
                                x: targetX,
                                duration: 200,
                                ease: 'Power2'
                            });
                        }
                    }
                    // After moving sourceCol to col, we continue but the sourceCol is now empty.
                    // The loop will eventually reach it and shift more.
                }
            }
        }

        if (animatedAny) {
            this.scene.time.delayedCall(maxDuration, onComplete);
        } else {
            onComplete();
        }
    }


    public refillGrid() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.tiles[row][col] === null) {
                    const x = this.startX + (col * this.tileSize);
                    const y = this.startY + (row * this.tileSize);
                    this.createTile(row, col, x, y);

                    // Fade in effect
                    const tile = this.tiles[row][col]!;
                    tile.setAlpha(0);
                    this.scene.tweens.add({
                        targets: tile,
                        alpha: 1,
                        duration: 300
                    });
                }
            }
        }
    }

    public reloadGrid() {
        // Destroy all existing tiles
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.tiles[row][col]) {
                    this.tiles[row][col]!.destroy();
                    this.tiles[row][col] = null;
                }
            }
        }
        // Rebuild
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = this.startX + (col * this.tileSize);
                const y = this.startY + (row * this.tileSize);
                this.createTile(row, col, x, y);

                const tile = this.tiles[row][col]!;
                tile.setAlpha(0);
                this.scene.tweens.add({
                    targets: tile,
                    alpha: 1,
                    duration: 300,
                    delay: (row * this.cols + col) * 10 // Staggered fade in
                });
            }
        }
    }

    private startSelection(tile: Phaser.GameObjects.Container) {
        this.selectedTiles = [tile];
        this.highlightTile(tile, true);
        this.emitSelectionUpdate();
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
                this.emitSelectionUpdate();
            }
        }
    }

    private emitSelectionUpdate() {
        const word = this.selectedTiles.map(t => t.getData('letter')).join('');
        this.onSelectionUpdate(word);
    }

    private endSelection() {
        if (this.selectedTiles.length > 0) {
            const word = this.selectedTiles.map(t => t.getData('letter')).join('');
            this.onWordSelected(word);

            // Reset visual IF match handling doesn't take over
            // In GameScene, handleWordSelection will call handleMatch if valid.
            // We should only reset here if NOT match, but for now reset and let handleMatch destroy.
            this.selectedTiles.forEach(t => this.highlightTile(t, false));
            this.selectedTiles = [];

            // Clear current selection text
            this.onSelectionUpdate('');
        }
    }

    private highlightTile(tile: Phaser.GameObjects.Container, isSelected: boolean) {
        const bg = tile.getByName('bg') as Phaser.GameObjects.Graphics;
        if (bg) {
            bg.clear();
            if (isSelected) {
                bg.fillStyle(0x646cff, 1); // Vibrant purple/blue for selection
            } else {
                bg.fillStyle(0xffffff, 1);
            }
            bg.fillRoundedRect(-this.tileSize / 2 + 2, -this.tileSize / 2 + 2, this.tileSize - 4, this.tileSize - 4, 8);
        }

        const text = tile.list[1] as Phaser.GameObjects.Text;
        if (text) {
            text.setColor(isSelected ? '#ffffff' : '#333333');
        }
    }
}
