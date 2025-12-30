import React, { useState } from 'react';
import styled from 'styled-components/native';
import { PageContainer } from '../components/PageContainer';
import { CyberButton } from '../components/CyberButton';
import { useTime } from '../context/TimeContext';
import { LeaveType } from '../types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, FlatList, Alert, View, TextInput } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

const Title = styled.Text`
  color: ${props => props.theme.colors.text};
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-top: 20px;
  margin-bottom: 20px;
`;

const Section = styled.View`
  margin-bottom: 20px;
  width: 90%;
  align-self: center;
  background: ${props => props.theme.colors.surface};
  padding: 20px;
  border-radius: 16px;
`;

const Label = styled.Text`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
  margin-bottom: 8px;
  text-transform: uppercase;
`;

const StatRow = styled.View`
  flex-direction: row;
  justify-content: space-around;
  margin-bottom: 20px;
`;

const StatItem = styled.View`
  align-items: center;
`;

const StatValue = styled.Text`
  color: ${props => props.theme.colors.primary};
  font-size: 24px;
  font-weight: bold;
`;

const LeaveItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  padding: 12px;
  border-bottom-width: 1px;
  border-bottom-color: ${props => props.theme.colors.border};
`;

const LeaveText = styled.Text`
  color: ${props => props.theme.colors.text};
  font-size: 16px;
`;

const TypeBadge = styled.View<{ type: LeaveType | 'HOLIDAY' }>`
  background-color: ${props => {
    switch (props.type) {
      case 'SICK': return '#FF4B2B';
      case 'CASUAL': return '#12c2e9';
      case 'HOLIDAY': return '#00b09b';
      default: return props.theme.colors.primary;
    }
  }};
  padding: 6px 12px;
  border-radius: 16px;
`;

const BadgeText = styled.Text`
  color: #fff;
  font-weight: bold;
  font-size: 10px;
`;

// Removed Input styled component

const LeaveScreen = () => {
  const { getRemainingLeaves, addLeave, addHoliday, leaves, holidays } = useTime();
  const { theme } = useTheme();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [selectedType, setSelectedType] = useState<LeaveType | 'HOLIDAY'>('SICK');
  const [note, setNote] = useState('');

  const handleApply = async () => {
    if (selectedType === 'HOLIDAY') {
      const success = await addHoliday(date, note);
      if (success) {
        Alert.alert("Success", "Holiday recorded.");
        setNote('');
      }
    } else {
      const success = await addLeave(date, selectedType, note);
      if (success) {
        Alert.alert("Success", "Leave recorded.");
        setNote('');
      }
    }
  };

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  // Merge and sort
  const allRecords = [
    ...leaves.map(l => ({ ...l, isHoliday: false })),
    ...holidays.map(h => ({ ...h, type: 'HOLIDAY', isHoliday: true }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <PageContainer>
      <Title>Leave Management</Title>

      <StatRow>
        <StatItem>
          <StatValue>{getRemainingLeaves('SICK')}</StatValue>
          <Label>Sick Left</Label>
        </StatItem>
        <StatItem>
          <StatValue>{getRemainingLeaves('CASUAL')}</StatValue>
          <Label>Casual Left</Label>
        </StatItem>
      </StatRow>

      <Section>
        <Label>New Request</Label>
        <CyberButton
          title={format(date, 'yyyy-MM-dd')}
          onPress={() => setShowPicker(true)}
          variant="secondary"
          style={{ width: '100%' }}
        />
        {showPicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onChange}
          />
        )}

        <TextInput
          placeholder="Reason (Optional)"
          placeholderTextColor={theme.colors.textSecondary}
          value={note}
          onChangeText={setNote}
          style={{
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            padding: 15,
            borderRadius: 8,
            fontSize: 16,
            marginTop: 15,
            width: '100%',
          }}
        />

        <Label style={{ marginTop: 15 }}>Type: {selectedType}</Label>
        <StatRow style={{ gap: 10 }}>
          <CyberButton
            title="SICK"
            onPress={() => setSelectedType('SICK')}
            gradientColors={selectedType === 'SICK' ? ['#4CAF50', '#81C784'] : ['#FFCDD2', '#EF9A9A']}
            variant="primary"
            style={{ flex: 1 }}
            size="small"
          />
          <CyberButton
            title="CASUAL"
            onPress={() => setSelectedType('CASUAL')}
            gradientColors={selectedType === 'CASUAL' ? ['#4CAF50', '#81C784'] : ['#FFCDD2', '#EF9A9A']}
            variant="primary"
            style={{ flex: 1 }}
            size="small"
          />
          <CyberButton
            title="HOLIDAY"
            onPress={() => setSelectedType('HOLIDAY')}
            gradientColors={selectedType === 'HOLIDAY' ? ['#4CAF50', '#81C784'] : ['#FFCDD2', '#EF9A9A']}
            variant="primary"
            style={{ flex: 1 }}
            size="small"
          />
        </StatRow>

        <CyberButton
          title={`SUBMIT ${selectedType === 'HOLIDAY' ? 'HOLIDAY' : 'LEAVE'}`}
          onPress={handleApply}
          variant="danger"
          style={{ width: '100%', marginTop: 10 }}
        />
      </Section>

      <Title style={{ fontSize: 20 }}>History</Title>
      <FlatList
        data={allRecords}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <LeaveItem>
            <View>
              <LeaveText>{item.date}</LeaveText>
              {item.note ? (
                <LeaveText style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 }}>
                  {item.note}
                </LeaveText>
              ) : null}
            </View>
            <TypeBadge type={item.type as any}>
              <BadgeText>{item.type}</BadgeText>
            </TypeBadge>
          </LeaveItem>
        )}
      />
    </PageContainer>
  );
};

export default LeaveScreen;
