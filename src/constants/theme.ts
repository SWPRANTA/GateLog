export const darkTheme = {
    mode: 'dark',
    colors: {
        primary: '#00F0FF', // Cyber Cyan
        secondary: '#D000FF', // Neon Purple
        background: '#050510',
        surface: 'rgba(20, 20, 40, 0.8)', // Glassy
        surfaceHighlight: 'rgba(40, 40, 70, 0.9)',
        text: '#FFFFFF',
        textSecondary: '#A0A0B0',
        success: '#00FF94',
        error: '#FF0055',
        warning: '#FFD600',
        border: 'rgba(0, 240, 255, 0.2)',
        chartTrack: '#1A1A3A',
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        s: 4,
        m: 8,
        l: 16,
        xl: 24,
    },
    typography: {
        h1: { fontSize: 32, fontWeight: '700', letterSpacing: 1 },
        h2: { fontSize: 24, fontWeight: '600' },
        body: { fontSize: 16, fontWeight: '400' },
        caption: { fontSize: 12, fontWeight: '400', color: '#A0A0B0' },
    }
};

export const lightTheme = {
    mode: 'light',
    colors: {
        primary: '#008088', // Darker Cyan
        secondary: '#8000AA',
        background: '#F0F2F5',
        surface: '#FFFFFF',
        surfaceHighlight: '#E0E5EC',
        text: '#101020',
        textSecondary: '#606070',
        success: '#00AA60',
        error: '#D00040',
        warning: '#CCAA00',
        border: 'rgba(0, 128, 136, 0.2)',
        chartTrack: '#E0E0E0',
    },
    spacing: darkTheme.spacing,
    borderRadius: darkTheme.borderRadius,
    typography: darkTheme.typography,
};

export type Theme = typeof darkTheme;
