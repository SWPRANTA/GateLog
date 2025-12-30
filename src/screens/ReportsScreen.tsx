import React, { useState, useMemo } from 'react';
import styled from 'styled-components/native';
import { PageContainer } from '../components/PageContainer';
import { CyberButton } from '../components/CyberButton';
import { useTime } from '../context/TimeContext';
import { useTheme } from '../context/ThemeContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, eachDayOfInterval, isWithinInterval, addDays } from 'date-fns';
import { Alert, FlatList, View, Platform, TouchableOpacity } from 'react-native';
import { formatDuration } from '../utils/format';
import DateTimePicker from '@react-native-community/datetimepicker';

const ButtonGroup = styled.View`
  width: 100%;
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const Title = styled.Text`
  color: ${props => props.theme.colors.text};
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
  text-align: center;
`;

const DateRangeContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 10px 20px;
  gap: 10px;
`;

const DatePickerButton = styled.TouchableOpacity`
  flex: 1;
  padding: 12px;
  background-color: ${props => props.theme.colors.surface};
  border-radius: 8px;
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
  align-items: center;
`;

const DatePickerLabel = styled.Text`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 12px;
  margin-bottom: 4px;
`;

const DatePickerValue = styled.Text`
  color: ${props => props.theme.colors.text};
  font-size: 14px;
  font-weight: bold;
`;

// Helper to pair logs
const pairLogs = (logs: any[]) => {
  const pairs = [];
  for (let i = 0; i < logs.length; i++) {
    if (logs[i].type === 'ENTRY') {
      const entry = logs[i];
      const exit = logs[i + 1] && logs[i + 1].type === 'EXIT' ? logs[i + 1] : null;

      let duration = 0;
      if (exit) {
        duration = (exit.timestamp - entry.timestamp) / (1000 * 60 * 60);
        i++;
      }
      pairs.push({
        date: format(entry.timestamp, 'yyyy-MM-dd'),
        entry: format(entry.timestamp, 'HH:mm:ss'),
        exit: exit ? format(exit.timestamp, 'HH:mm:ss') : 'MISSING',
        duration: duration
      });
    }
  }
  return pairs;
};

const CalendarGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-vertical: 5px;
  width: 100%;
`;

const DayCell = styled.View<{ metGoal?: boolean, isToday?: boolean, hasData?: boolean, isWeeklyHoliday?: boolean, isLeave?: boolean, isHoliday?: boolean }>`
  width: 13.5%;
  aspect-ratio: 1;
  margin: 0.3%;
  align-items: center;
  justify-content: center;
  background-color: ${props => {
    if (props.isWeeklyHoliday) return props.theme.colors.border;
    if (props.isLeave) return '#FFB74D';
    if (props.isHoliday) return '#4FC3F7';
    if (props.metGoal) return props.theme.colors.success;
    if (props.hasData) return props.theme.colors.error;
    return 'transparent';
  }};
  border-radius: 4px;
  border-width: ${props => props.isToday ? '1px' : '0px'};
  border-color: ${props => props.theme.colors.text};
`;

const DayText = styled.Text<{ hasData?: boolean }>`
  color: ${props => props.hasData ? '#000' : props.theme.colors.textSecondary};
  font-weight: bold;
`;

const WeekHeader = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  width: 100%;
  margin-bottom: 5px;
`;

const WeekDayText = styled.Text`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 12px; 
  width: 13.5%;
  margin: 0.3%;
  text-align: center;
  font-weight: bold;
`;

const LogItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: ${props => props.theme.colors.surface};
  border-radius: 8px;
  margin-bottom: 6px;
  border-width: 1px;
  border-color: ${props => props.theme.colors.border};
`;

const LogDate = styled.Text`
  color: ${props => props.theme.colors.text};
  font-weight: bold;
  font-size: 14px;
`;

const LogTime = styled.Text`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 12px;
  margin-top: 2px;
`;

const LogDuration = styled.Text<{ met?: boolean }>`
  color: ${props => props.met ? props.theme.colors.success : props.theme.colors.text};
  font-weight: bold;
  font-size: 16px;
`;

const LogBadge = styled.Text<{ type: string }>`
  font-size: 10px;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: ${props => {
    switch (props.type) {
      case 'WEEKLY_HOLIDAY': return '#888';
      case 'LEAVE': return '#FFB74D';
      case 'HOLIDAY': return '#4FC3F7';
      default: return 'transparent';
    }
  }};
`;

const CSVButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 0 10px;
  gap: 10px;
  margin-bottom: 10px;
`;

const ReportsScreen = () => {
  const { logs, leaves, holidays, weeklyHolidays, getDurationForDate, goals, exportAllData, importAllData } = useTime();
  const { theme } = useTheme();

  // Date range state
  const [startDate, setStartDate] = useState(() => startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(() => endOfMonth(new Date()));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Calendar Logic - now uses weeklyHolidays from context
  const renderCalendar = () => {
    const now = new Date();
    const daysInMonth = endOfMonth(now).getDate();
    const startDay = startOfMonth(now).getDay(); // 0 is Sun
    const adjustedStart = startDay === 0 ? 6 : startDay - 1; // Mon=0

    const cells = [];
    // Empty slots
    for (let i = 0; i < adjustedStart; i++) {
      cells.push(<DayCell key={`empty-${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d);
      const dateStr = format(date, 'yyyy-MM-dd');
      const duration = getDurationForDate(date);
      const dayOfWeek = date.getDay();
      const isWeeklyHolidayDay = weeklyHolidays.includes(dayOfWeek);
      const isLeaveDay = leaves.some(l => l.date === dateStr);
      const isHolidayDay = holidays.some(h => h.date === dateStr);

      const isFri = dayOfWeek === 5;
      const target = isFri ? goals.friday : goals.daily;

      let colorType: 'green' | 'red' | 'none' = 'none';

      // Skip weekly holidays, leaves, and holiday for goal checking
      if (!isWeeklyHolidayDay && !isLeaveDay && !isHolidayDay) {
        if (duration >= target) {
          colorType = 'green';
        } else if (new Date() > date && !isSameDay(date, new Date())) {
          colorType = 'red';
        }
      }

      cells.push(
        <DayCell
          key={d}
          metGoal={colorType === 'green'}
          hasData={colorType === 'red'}
          isToday={isSameDay(date, new Date())}
          isWeeklyHoliday={isWeeklyHolidayDay}
          isLeave={isLeaveDay}
          isHoliday={isHolidayDay}
        >
          <DayText hasData={colorType !== 'none' || isWeeklyHolidayDay || isLeaveDay || isHolidayDay}>{d}</DayText>
        </DayCell>
      );
    }
    return cells;
  };

  // Generate PDF report for selected date range with weekly grouping
  const generateReport = async () => {
    const filteredLogs = logs.filter(l =>
      l.timestamp >= startDate.getTime() && l.timestamp <= endDate.getTime()
    );
    const paired = pairLogs(filteredLogs);

    // Group by week
    const weekGroups: { [key: string]: typeof paired } = {};
    paired.forEach(p => {
      const date = new Date(p.date);
      const weekStart = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      if (!weekGroups[weekStart]) {
        weekGroups[weekStart] = [];
      }
      weekGroups[weekStart].push(p);
    });

    // Build HTML with weekly sections
    let weeklyHtml = '';
    const sortedWeeks = Object.keys(weekGroups).sort();

    sortedWeeks.forEach(weekStart => {
      const weekEnd = format(addDays(new Date(weekStart), 6), 'yyyy-MM-dd');
      const weekLogs = weekGroups[weekStart];
      const weekTotal = weekLogs.reduce((acc, curr) => acc + curr.duration, 0);

      weeklyHtml += `
        <h3 style="margin-top: 30px; color: #2c3e50;">Week: ${weekStart} to ${weekEnd}</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Entry Time</th>
              <th>Exit Time</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
          ${weekLogs.map(p => `
            <tr>
              <td>${p.date}</td>
              <td>${p.entry}</td>
              <td>${p.exit}</td>
              <td>${formatDuration(p.duration)}</td>
            </tr>
          `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="text-align:right;">Week Total:</td>
              <td>${formatDuration(weekTotal)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    });

    const totalHours = paired.reduce((acc, curr) => acc + curr.duration, 0);

    const html = `
      <html>
        <head>
          <style>
             body { font-family: 'Helvetica Neue', Helvetica, sans-serif; padding: 40px; color: #333; }
             h1 { text-align: center; color: #2c3e50; margin-bottom: 10px; }
             p.subtitle { text-align: center; color: #7f8c8d; margin-bottom: 20px; }
             table { width: 100%; border-collapse: collapse; margin-top: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
             th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
             th { background-color: #f8f9fa; font-weight: bold; color: #2c3e50; }
             tr:nth-child(even) { background-color: #f9f9f9; }
             tfoot { font-weight: bold; background-color: #ecf0f1; }
             .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; }
             .grand-total { margin-top: 30px; padding: 15px; background-color: #2c3e50; color: white; text-align: center; font-size: 18px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>GateLog Attendance Report</h1>
          <p class="subtitle">${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}</p>
          
          ${weeklyHtml}
          
          ${paired.length === 0 ? '<p style="text-align:center; color: #999;">No entries for this period</p>' : ''}
          
          <div class="grand-total">GRAND TOTAL: ${formatDuration(totalHours)}</div>
          
          <div class="footer">Generated by GateLog</div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to generate PDF");
    }
  };

  // Export all data as CSV
  const handleExportCSV = async () => {
    try {
      const data = exportAllData();

      // Create CSV content
      let csvContent = 'type,date,entry_time,exit_time,duration_hours,day_type,note\n';

      // Export logs
      const paired = pairLogs(data.logs);
      paired.forEach(p => {
        const dateStr = p.date;
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay();

        let dayType = 'REGULAR';
        if (data.weeklyHolidays.includes(dayOfWeek)) dayType = 'WEEKLY_HOLIDAY';

        const leaveRecord = data.leaves.find(l => l.date === dateStr);
        if (leaveRecord) dayType = leaveRecord.type;

        const holidayRecord = data.holidays.find(h => h.date === dateStr);
        if (holidayRecord) dayType = 'HOLIDAY';

        csvContent += `LOG,${p.date},${p.entry},${p.exit},${p.duration.toFixed(2)},${dayType},\n`;
      });

      // Export leaves
      data.leaves.forEach(l => {
        csvContent += `LEAVE,${l.date},,,,${l.type},${l.note || ''}\n`;
      });

      // Export holidays
      data.holidays.forEach(h => {
        csvContent += `HOLIDAY,${h.date},,,,HOLIDAY,${h.note || ''}\n`;
      });

      // Export settings
      csvContent += `SETTINGS,weekly_holidays,${data.weeklyHolidays.join('|')},,,,\"[${data.weeklyHolidays.join(',')}]\"\n`;
      csvContent += `SETTINGS,goals,${data.goals.daily},${data.goals.friday},${data.goals.weekly},,daily|friday|weekly\n`;
      csvContent += `SETTINGS,leave_limits,${data.leaveLimits.sick},${data.leaveLimits.casual},,,sick|casual\n`;

      // Also export raw JSON for easy import
      const jsonContent = JSON.stringify(data, null, 2);
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');

      // Offer choice: Save to location or Share
      Alert.alert(
        "Export Data",
        "Choose how to save your data:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save to Folder",
            onPress: async () => {
              try {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

                if (permissions.granted) {
                  // Save CSV
                  const csvUri = await FileSystem.StorageAccessFramework.createFileAsync(
                    permissions.directoryUri,
                    `gatelog_export_${timestamp}.csv`,
                    'text/csv'
                  );
                  await FileSystem.writeAsStringAsync(csvUri, csvContent);

                  // Save JSON backup
                  const jsonUri = await FileSystem.StorageAccessFramework.createFileAsync(
                    permissions.directoryUri,
                    `gatelog_backup_${timestamp}.json`,
                    'application/json'
                  );
                  await FileSystem.writeAsStringAsync(jsonUri, jsonContent);

                  Alert.alert("Success", "Files saved to your selected folder!");
                } else {
                  Alert.alert("Cancelled", "Permission not granted.");
                }
              } catch (err) {
                console.error(err);
                Alert.alert("Error", "Failed to save to folder");
              }
            }
          },
          {
            text: "Share",
            onPress: async () => {
              const csvFilename = `gatelog_export_${timestamp}.csv`;
              const csvPath = FileSystem.documentDirectory + csvFilename;
              await FileSystem.writeAsStringAsync(csvPath, csvContent);

              await Sharing.shareAsync(csvPath, {
                mimeType: 'text/csv',
                dialogTitle: 'Export GateLog Data'
              });
            }
          }
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to export data");
    }
  };

  // Import data from JSON file
  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);

      // Try parsing as JSON first
      try {
        const data = JSON.parse(content);

        // Validate required fields
        if (!data.logs && !data.leaves && !data.holidays) {
          Alert.alert("Invalid File", "The file doesn't contain valid GateLog data.");
          return;
        }

        Alert.alert(
          "Confirm Import",
          "This will replace all existing data with the imported data. Are you sure?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Import",
              style: "destructive",
              onPress: async () => {
                await importAllData(data);
                Alert.alert("Success", "Data imported successfully! Restart the app to see changes.");
              }
            }
          ]
        );
      } catch (parseError) {
        Alert.alert("Invalid File", "Could not parse the file. Please use a valid JSON backup file.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to import data");
    }
  };

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return logs.filter(l => l.timestamp >= start.getTime() && l.timestamp <= end.getTime());
  }, [logs]);

  const pairedList = useMemo(() => {
    return pairLogs(filteredLogs).reverse(); // Newest first
  }, [filteredLogs]);

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) setStartDate(selectedDate);
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) setEndDate(selectedDate);
  };

  return (
    <PageContainer>
      <View style={{ flex: 1 }}>
        <Title style={{ marginTop: 5, marginBottom: 0 }}>Reports</Title>
        <Title style={{ fontSize: 14, marginTop: 0, marginBottom: 0 }}>Monthly Performance</Title>

        <WeekHeader>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <WeekDayText key={day}>{day}</WeekDayText>
          ))}
        </WeekHeader>

        <CalendarGrid>
          {renderCalendar()}
        </CalendarGrid>

        {/* Date Range Picker */}
        <DateRangeContainer>
          <DatePickerButton onPress={() => setShowStartPicker(true)}>
            <DatePickerLabel>Start Date</DatePickerLabel>
            <DatePickerValue>{format(startDate, 'MMM dd, yyyy')}</DatePickerValue>
          </DatePickerButton>
          <DatePickerButton onPress={() => setShowEndPicker(true)}>
            <DatePickerLabel>End Date</DatePickerLabel>
            <DatePickerValue>{format(endDate, 'MMM dd, yyyy')}</DatePickerValue>
          </DatePickerButton>
        </DateRangeContainer>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onStartDateChange}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onEndDateChange}
          />
        )}

        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <Title style={{ fontSize: 16, marginTop: 2, marginBottom: 5, textAlign: 'left' }}>Daily Records</Title>
          <FlatList
            data={pairedList}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <LogItem>
                <View>
                  <LogDate>{item.date}</LogDate>
                  <LogTime>{item.entry} - {item.exit}</LogTime>
                </View>
                <LogDuration met={item.duration >= 5}>{item.duration.toFixed(2)}h</LogDuration>
              </LogItem>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>

        <View style={{ padding: 10, paddingBottom: 10 }}>
          <CyberButton
            title="Generate Report (PDF)"
            onPress={generateReport}
            size="small"
            style={{ marginBottom: 10 }}
          />
          <CSVButtonContainer>
            <CyberButton
              title="Export CSV"
              onPress={handleExportCSV}
              variant="secondary"
              size="small"
              style={{ flex: 1 }}
            />
            <CyberButton
              title="Import Data"
              onPress={handleImportCSV}
              variant="secondary"
              size="small"
              style={{ flex: 1 }}
            />
          </CSVButtonContainer>
        </View>
      </View>
    </PageContainer>
  );
};

export default ReportsScreen;
