import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { TimeProvider } from './src/context/TimeContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <TimeProvider>
          <AppNavigator />
        </TimeProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
