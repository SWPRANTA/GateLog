import React from 'react';
import styled from 'styled-components/native';
import { TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface CyberButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'danger';
    style?: any;
    gradientColors?: string[];
    size?: 'normal' | 'small';
}

const ButtonContainer = styled(TouchableOpacity) <{ size?: 'normal' | 'small' }>`
  margin-vertical: 10px;
  border-radius: ${props => props.theme.borderRadius.l}px;
  overflow: hidden;
  elevation: 5;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 4px;
  width: ${props => props.size === 'small' ? 'auto' : '80%'};
`;

const Gradient = styled(LinearGradient) <{ size?: 'normal' | 'small' }>`
  padding-vertical: ${props => props.size === 'small' ? '12px' : '18px'};
  padding-horizontal: ${props => props.size === 'small' ? '12px' : '32px'};
  align-items: center;
  justify-content: center;
`;

const ButtonText = styled.Text<{ size?: 'normal' | 'small' }>`
  color: white;
  font-size: ${props => props.size === 'small' ? '12px' : '18px'};
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: ${props => props.size === 'small' ? '0.5px' : '1.5px'};
`;

export const CyberButton: React.FC<CyberButtonProps> = ({ onPress, title, variant = 'primary', style, gradientColors, size = 'normal' }) => {
    const { theme } = useTheme();

    let colors = [theme.colors.primary, theme.colors.secondary];
    if (gradientColors) {
        colors = gradientColors;
    } else if (variant === 'secondary') {
        colors = [theme.colors.secondary, theme.colors.primary]; // Inverted
    } else if (variant === 'danger') {
        colors = [theme.colors.error, '#FF4466'];
    }

    return (
        <ButtonContainer onPress={onPress} style={style} size={size}>
            <Gradient
                colors={colors as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                size={size}
            >
                <ButtonText size={size}>{title}</ButtonText>
            </Gradient>
        </ButtonContainer>
    );
}
