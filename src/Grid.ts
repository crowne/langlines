import Phaser from 'phaser';
import { themeManager } from './ThemeManager';

export class Grid {
    private scene: Phaser.Scene;
    private rows: number;
    private cols: number;
    private tileSize: number;
    private tiles: (Phaser.GameObjects.Container | null)[][];
    private vowels: string[] = ['A', 'E', 'I', 'O', 'U'];
    private consonants: string[] = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
    private isSelecting: boolean = false;
    private onWordSelected: (word: string, multipliers: number[]) => void;
    private onSelectionUpdate: (word: string, multipliers: number[]) => void;
    private startX: number = 0;
    private startY: number = 0;

    constructor(scene: Phaser.Scene, rows: number, cols: number, tileSize: number, onWordSelected: (word: string, multipliers: number[]) => void, onSelectionUpdate: (word: string, multipliers: number[]) => void) {
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

        this.assignSpecialTiles();

        // Handle global selection logic
        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => this.handlePointerMove(pointer));
        this.scene.input.on('pointerup', () => this.endSelection());
    }

    private selectedTiles: Phaser.GameObjects.Container[] = [];

    private createTile(row: number, col: number, x: number, y: number, multiplier: number = 1) {
        const palette = themeManager.getPalette();
        // Weighted random: 40% vowels, 60% consonants
        const isVowel = Math.random() < 0.4;
        const char = Phaser.Utils.Array.GetRandom(isVowel ? this.vowels : this.consonants);

        const container = this.scene.add.container(x, y);

        // Tile Background
        const bg = this.scene.add.graphics();
        bg.fillStyle(palette.tileBg, 1);
        bg.fillRoundedRect(-this.tileSize / 2 + 2, -this.tileSize / 2 + 2, this.tileSize - 4, this.tileSize - 4, 8);
        bg.setName('bg');

        // Letter
        const text = this.scene.add.text(0, 0, char, {
            fontSize: `${this.tileSize * 0.5}px`,
            color: palette.tileText,
            fontFamily: 'Outfit',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, text]);
        container.setData('letter', char);
        container.setData('row', row);
        container.setData('col', col);
        container.setData('multiplier', multiplier);

        if (multiplier > 1) {
            const asteriskColor = multiplier === 3 ? '#ffd700' : '#00bfff';
            // Use Unicode ² (\u00B2) and ³ (\u00B3)
            const superscript = multiplier === 3 ? '\u00B3' : '\u00B2';

            const badgeText = this.scene.add.text(this.tileSize / 2 - 2, -this.tileSize / 2 + 4, superscript, {
                fontSize: '24px',
                color: asteriskColor,
                fontStyle: 'bold'
            }).setOrigin(1, 0);
            container.add(badgeText);
        }

        // Make container size match tile for interaction
        container.setSize(this.tileSize - 4, this.tileSize - 4);
        container.setInteractive();

        // Interaction - pointerover is removed in favor of handlePointerMove
        container.on('pointerdown', () => this.startSelection(container));

        this.tiles[row][col] = container;
    }

    private startSelection(tile: Phaser.GameObjects.Container) {
        this.isSelecting = true;
        this.selectedTiles = [tile];
        this.highlightTile(tile, true);
        this.emitSelectionUpdate();
    }

    private handlePointerMove(pointer: Phaser.Input.Pointer) {
        if (!this.isSelecting) return;

        // Map world coordinates to grid coordinates
        const localX = pointer.x - this.startX + (this.tileSize / 2);
        const localY = pointer.y - this.startY + (this.tileSize / 2);

        const col = Math.floor(localX / this.tileSize);
        const row = Math.floor(localY / this.tileSize);

        // Bounds check
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;

        const tile = this.tiles[row][col];
        if (!tile) return;

        // Distance check for "intentionality" (Distance from tile center)
        const tileCenterX = this.startX + (col * this.tileSize);
        const tileCenterY = this.startY + (row * this.tileSize);
        const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, tileCenterX, tileCenterY);

        // Only select if within 40% of tile center radius
        const threshold = this.tileSize * 0.4;
        if (dist > threshold) return;

        // Check if already in selection
        const index = this.selectedTiles.indexOf(tile);
        if (index === -1) {
            // New tile: Check adjacency
            const lastTile = this.selectedTiles[this.selectedTiles.length - 1];
            const dRow = Math.abs(row - lastTile.getData('row'));
            const dCol = Math.abs(col - lastTile.getData('col'));

            if (dRow <= 1 && dCol <= 1) {
                this.selectedTiles.push(tile);
                this.highlightTile(tile, true);
                this.emitSelectionUpdate();
            }
        } else if (index === this.selectedTiles.length - 2) {
            // Backtracking: remove the last tile
            const lastTile = this.selectedTiles.pop()!;
            this.highlightTile(lastTile, false);
            this.emitSelectionUpdate();
        }
    }

    private emitSelectionUpdate() {
        const word = this.selectedTiles.map(t => t.getData('letter')).join('');
        const multipliers = this.getMultipliers();
        this.onSelectionUpdate(word, multipliers);
    }

    private getMultipliers(): number[] {
        const multipliers: number[] = [];
        this.selectedTiles.forEach(t => {
            const m = t.getData('multiplier') || 1;
            if (m > 1) {
                multipliers.push(m);
            }
        });
        return multipliers;
    }

    private endSelection() {
        if (this.isSelecting) {
            this.isSelecting = false;
            const word = this.selectedTiles.map(t => t.getData('letter')).join('');
            const multipliers = this.getMultipliers();
            this.onWordSelected(word, multipliers);

            this.selectedTiles.forEach(t => this.highlightTile(t, false));
            this.selectedTiles = [];
            this.onSelectionUpdate('', []);
        }
    }

    public handleMatch() {
        // Destroy selected tiles and null them in grid
        this.selectedTiles.forEach(tile => {
            const row = tile.getData('row');
            const col = tile.getData('col');
            this.tiles[row][col] = null;

            // Vanish Animation
            this.scene.tweens.add({
                targets: tile,
                scale: 0,
                alpha: 0,
                duration: 300,
                ease: 'Back.easeIn',
                onComplete: () => tile.destroy()
            });
        });
        this.selectedTiles = [];
        this.onSelectionUpdate('', []);

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

    private assignSpecialTiles() {
        const allTiles: { row: number, col: number }[] = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                allTiles.push({ row: r, col: c });
            }
        }

        Phaser.Utils.Array.Shuffle(allTiles);

        // Assign 2x to first 3
        for (let i = 0; i < 3; i++) {
            const pos = allTiles[i];
            this.updateMultiplier(pos.row, pos.col, 2);
        }

        // Assign 3x to next 2
        for (let i = 3; i < 5; i++) {
            const pos = allTiles[i];
            this.updateMultiplier(pos.row, pos.col, 3);
        }
    }

    private updateMultiplier(row: number, col: number, multiplier: number) {
        const tile = this.tiles[row][col];
        if (!tile) return;

        const x = tile.x;
        const y = tile.y;
        tile.destroy();
        this.createTile(row, col, x, y, multiplier);
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

        this.assignSpecialTiles();
    }

    public shuffleTiles() {
        const activeTiles: Phaser.GameObjects.Container[] = [];
        const positions: { row: number, col: number, x: number, y: number }[] = [];

        // Collect all existing tiles and their positions
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (tile) {
                    activeTiles.push(tile);
                    positions.push({
                        row: row,
                        col: col,
                        x: tile.x,
                        y: tile.y
                    });
                }
            }
        }

        // Shuffle the positions array
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // Reassign tiles to new shuffled positions
        activeTiles.forEach((tile, index) => {
            const pos = positions[index];
            this.tiles[pos.row][pos.col] = tile;
            tile.setData('row', pos.row);
            tile.setData('col', pos.col);

            // Animate to new position
            this.scene.tweens.add({
                targets: tile,
                x: pos.x,
                y: pos.y,
                duration: 400,
                ease: 'Power2'
            });
        });
    }

    private highlightTile(tile: Phaser.GameObjects.Container, isSelected: boolean) {
        const palette = themeManager.getPalette();
        const bg = tile.getByName('bg') as Phaser.GameObjects.Graphics;
        if (bg) {
            bg.clear();
            if (isSelected) {
                const accentNum = themeManager.getMode() === 'dark' ? 0x646cff : 0x3b43d6;
                bg.fillStyle(accentNum, 1);

                // Selection Pulse Juice
                this.scene.tweens.add({
                    targets: tile,
                    scale: 1.1,
                    duration: 100,
                    yoyo: true,
                    ease: 'Quad.easeOut'
                });
            } else {
                bg.fillStyle(palette.tileBg, 1);

                // Reset scale
                this.scene.tweens.add({
                    targets: tile,
                    scale: 1.0,
                    duration: 100
                });
            }
            bg.fillRoundedRect(-this.tileSize / 2 + 2, -this.tileSize / 2 + 2, this.tileSize - 4, this.tileSize - 4, 8);
        }

        const text = tile.list[1] as Phaser.GameObjects.Text;
        if (text) {
            text.setColor(isSelected ? '#ffffff' : palette.tileText);
        }
    }

    public setInteractive(enabled: boolean) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (tile) {
                    if (enabled) {
                        tile.setInteractive();
                    } else {
                        tile.disableInteractive();
                        this.highlightTile(tile, false);
                    }
                }
            }
        }
        if (!enabled) {
            this.selectedTiles = [];
            this.onSelectionUpdate('', []);
        }
    }

    public getLinesCleared(): number {
        let cleared = 0;

        // Check rows
        for (let r = 0; r < this.rows; r++) {
            let rowEmpty = true;
            for (let c = 0; c < this.cols; c++) {
                if (this.tiles[r][c] !== null) {
                    rowEmpty = false;
                    break;
                }
            }
            if (rowEmpty) cleared++;
        }

        // Check columns
        for (let c = 0; c < this.cols; c++) {
            let colEmpty = true;
            for (let r = 0; r < this.rows; r++) {
                if (this.tiles[r][c] !== null) {
                    colEmpty = false;
                    break;
                }
            }
            if (colEmpty) cleared++;
        }

        return cleared;
    }

    public isGridEmpty(): boolean {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.tiles[r][c] !== null) {
                    return false;
                }
            }
        }
        return true;
    }
}
