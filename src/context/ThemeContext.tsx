/**
 * TiffinFlow Theme Context
 * Light/dark mode with warm food-app aesthetic — persisted across restarts
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/colors';
import type { ThemeMode } from '../types';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceWarm: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  border: string;
  divider: string;
  tabBar: string;
  tabBarBorder: string;
  statusBar: 'light' | 'dark';
}

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const lightColors: ThemeColors = {
  background: Colors.background,
  surface: Colors.surface,
  surfaceWarm: Colors.surfaceWarm,
  surfaceElevated: '#FFFFFF',
  textPrimary: Colors.textPrimary,
  textSecondary: Colors.textSecondary,
  textTertiary: Colors.textTertiary,
  textInverse: Colors.textInverse,
  border: Colors.border,
  divider: Colors.divider,
  tabBar: '#FFFFFF',
  tabBarBorder: Colors.border,
  statusBar: 'dark',
};

const darkColors: ThemeColors = {
  background: Colors.darkBackground,
  surface: Colors.darkSurface,
  surfaceWarm: '#2E1A0E',
  surfaceElevated: Colors.darkSurfaceElevated,
  textPrimary: Colors.textPrimaryDark,
  textSecondary: Colors.textSecondaryDark,
  textTertiary: '#8A7065',
  textInverse: Colors.textPrimary,
  border: Colors.borderDark,
  divider: '#2E1E10',
  tabBar: '#1F1008',
  tabBarBorder: '#2E1E10',
  statusBar: 'light',
};

const THEME_STORAGE_KEY = '@tiffinflow_theme';

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  colors: lightColors,
  isDark: false,
  toggleTheme: () => {},
  setMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');

  // Load persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setModeState(saved);
      } else if (systemScheme === 'dark') {
        setModeState('dark');
      }
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  const isDark = mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, isDark, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
