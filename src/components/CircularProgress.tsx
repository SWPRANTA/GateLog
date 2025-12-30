import React, { useEffect } from 'react';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import styled from 'styled-components/native';
import { View } from 'react-native';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
    progress: number; // 0 to >1 allowed
    size?: number;
    strokeWidth?: number;
    label?: string;
    subLabel?: string;
    color?: string;
    extraColor?: string;
}

const Container = styled.View`
  align-items: center;
  justify-content: center;
  position: relative;
`;

const InnerText = styled.View`
  position: absolute;
  align-items: center;
  justify-content: center;
`;

const Label = styled.Text`
  color: ${props => props.theme.colors.text};
  font-size: 32px;
  font-weight: bold;
`;

const SubLabel = styled.Text`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
  margin-top: 4px;
`;

export const CircularProgress: React.FC<CircularProgressProps> = ({
    progress,
    size = 200,
    strokeWidth = 15,
    label,
    subLabel,
    color,
    extraColor, // New prop
}) => {
    const { theme } = useTheme();
    const animatedProgress = useSharedValue(0);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Allow progress > 1
    const targetProgress = Math.max(progress, 0);

    useEffect(() => {
        animatedProgress.value = withTiming(targetProgress, { duration: 1000 });
    }, [targetProgress]);

    const mainAnimatedProps = useAnimatedProps(() => {
        const val = Math.min(animatedProgress.value, 1);
        return {
            strokeDashoffset: circumference * (1 - val),
        };
    });

    const extraAnimatedProps = useAnimatedProps(() => {
        const val = Math.max(animatedProgress.value - 1, 0);
        return {
            strokeDashoffset: circumference * (1 - val),
        };
    });

    return (
        <Container>
            <Svg width={size} height={size}>
                {/* Background Track */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={theme.colors.chartTrack}
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Main Progress Circle (0-100%) */}
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color || theme.colors.primary}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    animatedProps={mainAnimatedProps}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />

                {/* Extra Progress Circle (>100%) */}
                {extraColor && (
                    <AnimatedCircle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={extraColor}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeDasharray={circumference}
                        animatedProps={extraAnimatedProps}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${size / 2}, ${size / 2}`}
                    />
                )}
            </Svg>
            <InnerText>
                {label && <Label>{label}</Label>}
                {subLabel && <SubLabel>{subLabel}</SubLabel>}
            </InnerText>
        </Container>
    );
};
