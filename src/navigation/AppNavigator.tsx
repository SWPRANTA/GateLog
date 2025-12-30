import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LeaveScreen from '../screens/LeaveScreen';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator();

import { StatusBar } from 'expo-status-bar';

import * as SystemUI from 'expo-system-ui';

export const AppNavigator = () => {
    const { theme, mode } = useTheme();

    useEffect(() => {
        SystemUI.setBackgroundColorAsync(theme.colors.background);
    }, [theme]);

    return (
        <NavigationContainer theme={{
            dark: mode === 'dark',
            colors: {
                primary: theme.colors.primary,
                background: theme.colors.background,
                card: theme.colors.surface,
                text: theme.colors.text,
                border: theme.colors.border,
                notification: theme.colors.secondary,
            },
            fonts: DefaultTheme.fonts
        }}>
            <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
            <Stack.Navigator screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: theme.colors.background }
            }}>
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="Reports" component={ReportsScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Leaves" component={LeaveScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
