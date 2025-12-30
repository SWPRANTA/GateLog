import React, { useEffect, useState } from 'react';
import styled from 'styled-components/native';
import { PageContainer } from '../components/PageContainer';
import { CircularProgress } from '../components/CircularProgress';
import { CyberButton } from '../components/CyberButton';
import { useTime } from '../context/TimeContext';
import { useTheme } from '../context/ThemeContext';
import { Settings, FileText, Calendar } from 'lucide-react-native';
import { format } from 'date-fns';
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
  const { status, punch, getWeeklyProgress, getTodayProgress, logs, goals, getEffectiveWeeklyGoal } = useTime();
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

  const isFri = new Date().getDay() === 5;
  const dailyGoal = isFri ? goals.friday : goals.daily;
  const dailyProgress = todayHours / dailyGoal;

  const weeklyGoal = getEffectiveWeeklyGoal();
  const weeklyProgress = weeklyGoal > 0 ? weeklyHours / weeklyGoal : (weeklyHours > 0 ? 1 : 0);

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
              label={formatDuration(todayHours)}
              subLabel={`Daily (${dailyGoal}h)`}
              color={theme.colors.primary}
              extraColor={theme.colors.primary}
            />
            {todayHours >= dailyGoal && <GoalText>GOAL MET</GoalText>}
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
            {weeklyHours >= weeklyGoal && <GoalText>GOAL MET</GoalText>}
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
