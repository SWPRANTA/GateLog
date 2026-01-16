import React, { useEffect, useState } from 'react';
import styled from 'styled-components/native';
import { PageContainer } from '../components/PageContainer';
import { CircularProgress } from '../components/CircularProgress';
import { CyberButton } from '../components/CyberButton';
import { useTime } from '../context/TimeContext';
import { useTheme } from '../context/ThemeContext';
import { Settings, FileText, Calendar } from 'lucide-react-native';
import { format, startOfDay } from 'date-fns';
import { TouchableOpacity, Linking } from 'react-native';
import { formatDuration } from '../utils/format';

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  padding: 20px;
`;

const Content = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

const StatusText = styled.Text<{ status: string }>`
  font-size: 20px;
  color: ${props => props.status === 'IN' ? props.theme.colors.success : props.theme.colors.textSecondary};
  margin-bottom: 30px;
  font-weight: 600;
  letter-spacing: 1px;
`;

const StatRow = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  margin-top: 40px;
  margin-bottom: 40px;
`;

const StatItem = styled.View`
  align-items: center;
`;

const StatValue = styled.Text`
  color: ${props => props.theme.colors.text};
  font-size: 24px;
  font-weight: bold;
`;

const StatLabel = styled.Text`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 12px;
  text-transform: uppercase;
  margin-top: 4px;
`;

const ProgressContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  width: 100%;
  margin-bottom: 30px;
`;

const ProgressWrapper = styled.View`
  align-items: center;
`;

const DateDisplay = styled.Text`
  color: ${props => props.theme.colors.text};
  font-size: 18px;
  margin-bottom: 20px;
  font-weight: 500;
`;

const GoalText = styled.Text`
  color: ${props => props.theme.colors.success};
  font-size: 14px;
  font-weight: bold;
  margin-top: 10px;
`;

const ExpectedLeaveText = styled.Text`
  color: ${props => props.theme.colors.primary};
  font-size: 13px;
  margin-top: 8px;
  font-weight: 500;
`;

const SignatureContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 15px;
  margin-top: 20px;
`;

const SignatureText = styled.Text`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
`;

const SignatureLink = styled.Text`
  color: ${props => props.theme.colors.primary};
  font-size: 14px;
  font-weight: bold;
  text-decoration: underline;
`;

const DashboardScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { status, punch, getWeeklyProgress, getTodayProgress, logs, goals, getEffectiveWeeklyGoal, leaves, holidays } = useTime();
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [todayHours, setTodayHours] = useState(0);

  useEffect(() => {
    const update = () => {
      setWeeklyHours(getWeeklyProgress());
      setTodayHours(getTodayProgress());
    };
    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [logs]);

  const now = new Date();
  const isFri = now.getDay() === 5;
  const dailyGoal = isFri ? goals.friday : goals.daily;
  const isLeaveToday = leaves.some(l => l.date === format(now, 'yyyy-MM-dd'));
  const isHolidayToday = holidays.some(h => h.date === format(now, 'yyyy-MM-dd'));

  // If leave/holiday, the "goal" is effectively 0 for working, but we want to show the credited time.
  // The user asked to "Show the expected leave time".
  const dailyProgress = isLeaveToday || isHolidayToday ? 1 : (todayHours / dailyGoal);

  const weeklyGoal = getEffectiveWeeklyGoal();
  const weeklyProgress = weeklyGoal > 0 ? weeklyHours / weeklyGoal : (weeklyHours > 0 || isLeaveToday || isHolidayToday ? 1 : 0);

  // Calculate expected leave time based on first check-in of the day
  const getExpectedLeaveTime = () => {
    if (isLeaveToday || isHolidayToday) return null;

    const todayStart = startOfDay(now).getTime();
    const todayLogs = logs.filter(l => l.timestamp >= todayStart);

    // Find the first ENTRY log of today
    const firstEntry = todayLogs.find(l => l.type === 'ENTRY');
    if (!firstEntry) return null;

    // Calculate expected leave time: first entry + daily goal hours
    const expectedLeaveMs = firstEntry.timestamp + (dailyGoal * 60 * 60 * 1000);
    return new Date(expectedLeaveMs);
  };

  const expectedLeaveTime = getExpectedLeaveTime();
  const goalNotMet = todayHours < dailyGoal;

  return (
    <PageContainer>
      <Header>
        <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
          <FileText color={theme.colors.text} size={28} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Leaves')}>
          <Calendar color={theme.colors.text} size={28} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Settings color={theme.colors.text} size={28} />
        </TouchableOpacity>
      </Header>

      <Content>
        <DateDisplay>{format(new Date(), 'EEEE, d MMMM')}</DateDisplay>

        <ProgressContainer>
          <ProgressWrapper>
            <CircularProgress
              progress={dailyProgress}
              size={160}
              strokeWidth={15}
              label={isLeaveToday || isHolidayToday ? "LEAVE" : formatDuration(todayHours)}
              subLabel={isLeaveToday || isHolidayToday ? `Credited: ${dailyGoal}h` : `Daily (${dailyGoal}h)`}
              color={isLeaveToday || isHolidayToday ? theme.colors.success : theme.colors.primary}
              extraColor={theme.colors.primary}
            />
            {(todayHours >= dailyGoal || isLeaveToday || isHolidayToday) && <GoalText>GOAL MET</GoalText>}
            {expectedLeaveTime && goalNotMet && (
              <ExpectedLeaveText>
                Leave by {format(expectedLeaveTime, 'h:mm a')}
              </ExpectedLeaveText>
            )}
          </ProgressWrapper>

          <ProgressWrapper>
            <CircularProgress
              progress={weeklyProgress}
              size={160}
              strokeWidth={15}
              label={formatDuration(weeklyHours)}
              subLabel={`Weekly (${weeklyGoal}h)`}
              color={theme.colors.secondary}
              extraColor={theme.colors.secondary}
            />
            {(weeklyHours >= weeklyGoal) && <GoalText>GOAL MET</GoalText>}
          </ProgressWrapper>
        </ProgressContainer>

        <StatusText status={status}>
          {status === 'IN' ? 'ON CAMPUS' : 'OFF CAMPUS'}
        </StatusText>

        <CyberButton
          title={status === 'IN' ? 'CHECK OUT' : 'CHECK IN'}
          onPress={punch}
          variant={status === 'IN' ? 'danger' : 'primary'}
        />

        <SignatureContainer>
          <SignatureText>Made by </SignatureText>
          <TouchableOpacity onPress={() => Linking.openURL('https://github.com/SWPRANTA')}>
            <SignatureLink>Swapnil</SignatureLink>
          </TouchableOpacity>
          <SignatureText> with ❤️</SignatureText>
        </SignatureContainer>
      </Content>
    </PageContainer>
  );
};
export default DashboardScreen;
