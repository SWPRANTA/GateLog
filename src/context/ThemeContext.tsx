import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider as StyledProvider } from 'styled-components/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, Theme } from '../constants/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [mode, setMode] = useState<ThemeMode>('light');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedMode = await AsyncStorage.getItem('theme_mode');
            if (savedMode) setMode(savedMode as ThemeMode);
        } catch (e) {
            console.error('Failed to load theme', e);
        }
    };

    const saveMode = async (newMode: ThemeMode) => {
        setMode(newMode);
        try {
            await AsyncStorage.setItem('theme_mode', newMode);
        } catch (e) {
            console.error('Failed to save theme', e);
        }
    };

    // Debug logging
    useEffect(() => {
        console.log(`[ThemeContext] Mode: ${mode}, System: ${systemScheme}`);
    }, [mode, systemScheme]);

    const activeTheme = React.useMemo(() => {
        if (mode === 'system') {
            return systemScheme === 'dark' ? darkTheme : lightTheme;
        }
        return mode === 'dark' ? darkTheme : lightTheme;
    }, [mode, systemScheme]);

    return (
        <ThemeContext.Provider value={{
            theme: activeTheme,
            mode,
            setMode: saveMode,
            isDark: activeTheme.mode === 'dark'
        }}>
            <StyledProvider theme={activeTheme}>
                {children}
            </StyledProvider>
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
