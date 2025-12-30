import React from 'react';
import styled from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const Container = styled(LinearGradient)`
  flex: 1;
`;

const Safe = styled(SafeAreaView)`
  flex: 1;
`;

export const PageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { theme, mode } = useTheme();

    const colors = mode === 'dark'
        ? ['#050510', '#080818', '#000000']
        : ['#FFFFFF', '#F0F2F5', '#E5E5F0'];

    return (
        <Container colors={colors as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Safe>
                {children}
            </Safe>
        </Container>
    );
};
