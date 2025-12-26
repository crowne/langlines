export type ThemeMode = 'light' | 'dark';

export interface ColorPalette {
    background: number;
    backgroundStr: string;
    panel: number;
    panelStr: string;
    text: string;
    textSecondary: string;
    accent: string;
    accentSecondary: string;
    tileBg: number;
    tileText: string;
    match: string;
    error: string;
}

const DarkPalette: ColorPalette = {
    background: 0x222222,
    backgroundStr: '#222222',
    panel: 0x333333,
    panelStr: '#333333',
    text: '#ffffff',
    textSecondary: '#aaaaaa',
    accent: '#646cff',
    accentSecondary: '#7c84ff',
    tileBg: 0xffffff,
    tileText: '#333333',
    match: '#00ff00',
    error: '#ff0000'
};

const LightPalette: ColorPalette = {
    background: 0xf0f0f0,
    backgroundStr: '#f0f0f0',
    panel: 0xe0e0e0,
    panelStr: '#e0e0e0',
    text: '#1a1a1a',
    textSecondary: '#666666',
    accent: '#3b43d6',
    accentSecondary: '#5a62ff',
    tileBg: 0xffffff,
    tileText: '#1a1a1a',
    match: '#008800',
    error: '#cc0000'
};

class ThemeManager {
    private static instance: ThemeManager;
    private mode: ThemeMode = 'dark';

    private constructor() {
        const saved = localStorage.getItem('langlines-theme');
        if (saved === 'light' || saved === 'dark') {
            this.mode = saved;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            this.mode = 'light';
        }
    }

    public static getInstance(): ThemeManager {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }

    public getMode(): ThemeMode {
        return this.mode;
    }

    public setMode(mode: ThemeMode) {
        this.mode = mode;
        localStorage.setItem('langlines-theme', mode);
    }

    public toggleMode(): ThemeMode {
        this.mode = this.mode === 'light' ? 'dark' : 'light';
        localStorage.setItem('langlines-theme', this.mode);
        return this.mode;
    }

    public getPalette(): ColorPalette {
        return this.mode === 'light' ? LightPalette : DarkPalette;
    }
}

export const themeManager = ThemeManager.getInstance();
