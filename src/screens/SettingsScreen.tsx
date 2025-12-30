import React, { useState, useEffect } from 'react';
import styled from 'styled-components/native';
import { Button, Alert, Switch, TextInput, ScrollView, TouchableOpacity, View } from 'react-native';
import { PageContainer } from '../components/PageContainer';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTime } from '../context/TimeContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

const Title = styled.Text`
  color: ${props => props.theme.colors.text};
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-top: 20px;
  margin-bottom: 40px;
`;

const Section = styled.View`
  margin-bottom: 30px;
  width: 90%;
  align-self: center;
  background: ${props => props.theme.colors.surface};
  padding: 20px;
  border-radius: 16px;
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const Label = styled.Text`
  color: ${props => props.theme.colors.text};
  font-size: 16px;
`;

const Input = styled.TextInput`
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  padding: 8px 12px;
  border-radius: 8px;
  width: 80px;
  text-align: center;
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
`;

const DayChipContainer = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
`;

const DayChip = styled.TouchableOpacity<{ selected?: boolean }>`
  padding: 10px 14px;
  border-radius: 20px;
  background-color: ${props => props.selected ? '#00E3AE' : props.theme.colors.background};
  border-width: 1px;
  border-color: ${props => props.selected ? '#00E3AE' : props.theme.colors.border};
`;

const DayChipText = styled.Text<{ selected?: boolean }>`
  color: ${props => props.selected ? '#000' : props.theme.colors.text};
  font-weight: ${props => props.selected ? 'bold' : 'normal'};
  font-size: 14px;
`;

const SettingsScreen = () => {
    const { setMode, isDark } = useTheme();
    const { goals, updateGoals, leaveLimits, updateLeaveLimits, weeklyHolidays, updateWeeklyHolidays, exportAllData } = useTime();

    // Local state for inputs to allow editing
    const [daily, setDaily] = useState(goals.daily.toString());
    const [friday, setFriday] = useState(goals.friday.toString());
    const [weekly, setWeekly] = useState(goals.weekly.toString());

    // Leave limits state
    const [sickLimit, setSickLimit] = useState(leaveLimits.sick.toString());
    const [casualLimit, setCasualLimit] = useState(leaveLimits.casual.toString());

    useEffect(() => {
        setDaily(goals.daily.toString());
        setFriday(goals.friday.toString());
        setWeekly(goals.weekly.toString());
    }, [goals]);

    useEffect(() => {
        setSickLimit(leaveLimits.sick.toString());
        setCasualLimit(leaveLimits.casual.toString());
    }, [leaveLimits]);

    const handleSaveGoals = async () => {
        const d = parseFloat(daily);
        const f = parseFloat(friday);
        const w = parseFloat(weekly);

        if (isNaN(d) || isNaN(f) || isNaN(w)) {
            Alert.alert("Error", "Please enter valid numbers");
            return;
        }

        await updateGoals({ daily: d, friday: f, weekly: w });
        Alert.alert("Success", "Time goals updated!");
    };

    const handleSaveLimits = async () => {
        const s = parseInt(sickLimit);
        const c = parseInt(casualLimit);

        if (isNaN(s) || isNaN(c)) {
            Alert.alert("Error", "Please enter valid numbers");
            return;
        }

        await updateLeaveLimits({ sick: s, casual: c });
        Alert.alert("Success", "Leave limits updated!");
    };

    // Export data to user's preferred location
    const exportToLocation = async () => {
        try {
            const data = exportAllData();
            const jsonContent = JSON.stringify(data, null, 2);
            const filename = `gatelog_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;

            // Try to use SAF to let user pick location
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

            if (permissions.granted) {
                const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                    permissions.directoryUri,
                    filename,
                    'application/json'
                );
                await FileSystem.writeAsStringAsync(fileUri, jsonContent);
                Alert.alert("Success", `Data exported to:\n${filename}`);
            } else {
                // Fallback to sharing
                const filePath = FileSystem.documentDirectory + filename;
                await FileSystem.writeAsStringAsync(filePath, jsonContent);
                await Sharing.shareAsync(filePath, {
                    mimeType: 'application/json',
                    dialogTitle: 'Save GateLog Backup'
                });
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to export data");
        }
    };

    const handleClear = async () => {
        Alert.alert(
            "Clear All Data",
            "Would you like to export your data before clearing?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Export & Clear",
                    onPress: async () => {
                        await exportToLocation();
                        Alert.alert(
                            "Confirm Clear",
                            "Data exported. Now clear all data?",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Clear",
                                    style: "destructive",
                                    onPress: async () => {
                                        await AsyncStorage.removeItem('attendance_logs');
                                        await AsyncStorage.removeItem('leave_records');
                                        await AsyncStorage.removeItem('holiday_records');
                                        await AsyncStorage.removeItem('weekly_holidays');
                                        Alert.alert("Done", "Data cleared. Restart app to see empty state.");
                                    }
                                }
                            ]
                        );
                    }
                },
                {
                    text: "Clear Without Export",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem('attendance_logs');
                        await AsyncStorage.removeItem('leave_records');
                        await AsyncStorage.removeItem('holiday_records');
                        await AsyncStorage.removeItem('weekly_holidays');
                        Alert.alert("Done", "Data cleared. Restart app to see empty state.");
                    }
                }
            ]
        );
    };

    return (
        <PageContainer>
            <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
                <Title>Settings</Title>

                <Section>
                    <Label style={{ fontWeight: 'bold', marginBottom: 15 }}>Time Goals (Hours)</Label>
                    <Row>
                        <Label>Daily Min (Mon-Thu)</Label>
                        <Input
                            value={daily}
                            onChangeText={setDaily}
                            keyboardType="numeric"
                            onBlur={handleSaveGoals}
                        />
                    </Row>
                    <Row>
                        <Label>Daily Min (Friday)</Label>
                        <Input
                            value={friday}
                            onChangeText={setFriday}
                            keyboardType="numeric"
                            onBlur={handleSaveGoals}
                        />
                    </Row>
                    <Row>
                        <Label>Weekly Min</Label>
                        <Input
                            value={weekly}
                            onChangeText={setWeekly}
                            keyboardType="numeric"
                            onBlur={handleSaveGoals}
                        />
                    </Row>
                    <Button title="Update Goals" onPress={handleSaveGoals} color="#00E3AE" />
                </Section>

                <Section>
                    <Label style={{ fontWeight: 'bold', marginBottom: 15 }}>Leave Limits (Yearly)</Label>
                    <Row>
                        <Label>Total Sick Leaves</Label>
                        <Input
                            value={sickLimit}
                            onChangeText={setSickLimit}
                            keyboardType="numeric"
                            onBlur={handleSaveLimits}
                        />
                    </Row>
                    <Row>
                        <Label>Total Casual Leaves</Label>
                        <Input
                            value={casualLimit}
                            onChangeText={setCasualLimit}
                            keyboardType="numeric"
                            onBlur={handleSaveLimits}
                        />
                    </Row>
                    <Button title="Update Limits" onPress={handleSaveLimits} color="#00E3AE" />
                </Section>

                <Section>
                    <Label style={{ fontWeight: 'bold', marginBottom: 5 }}>Weekly Holidays</Label>
                    <Label style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>Select days that are weekly holidays (no work expected)</Label>
                    <DayChipContainer>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <DayChip
                                key={day}
                                selected={weeklyHolidays.includes(index)}
                                onPress={() => {
                                    const newHolidays = weeklyHolidays.includes(index)
                                        ? weeklyHolidays.filter(d => d !== index)
                                        : [...weeklyHolidays, index];
                                    updateWeeklyHolidays(newHolidays);
                                }}
                            >
                                <DayChipText selected={weeklyHolidays.includes(index)}>{day}</DayChipText>
                            </DayChip>
                        ))}
                    </DayChipContainer>
                </Section>

                <Section>
                    <Row>
                        <Label>Dark Mode</Label>
                        <Switch
                            value={isDark}
                            onValueChange={(val) => setMode(val ? 'dark' : 'light')}
                        />
                    </Row>
                </Section>

                <Section>
                    <Label style={{ marginBottom: 10 }}>Data Management</Label>
                    <Button title="Clear All Data" color="#FF0055" onPress={handleClear} />
                </Section>
            </ScrollView>
        </PageContainer>
    );
};
export default SettingsScreen;
