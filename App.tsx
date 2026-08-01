import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { getDb, runMigrations } from './db';
import { AttendanceProvider } from './context/AttendanceContext';
import { HomeScreen } from './screens/HomeScreen';
import { MarkAttendanceScreen } from './screens/MarkAttendanceScreen';
import { AddSubjectScreen } from './screens/AddSubjectScreen';
import { SubjectDetailScreen } from './screens/SubjectDetailScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';

import { trackAppOpen } from './utils/analytics';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6654F4',
        tabBarInactiveTintColor: '#8580A9',
        tabBarLabelStyle: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
        tabBarStyle: { height: 72, paddingTop: 8, paddingBottom: 10, backgroundColor: '#FFFFFF', borderTopColor: '#F0EDFF' },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={
              route.name === 'Today'
                ? 'home'
                : route.name === 'Review'
                  ? 'checkmark-done-circle-outline'
                  : 'person'
            }
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tabs.Screen name="Today" component={HomeScreen} options={{ title: 'Home' }} />
      <Tabs.Screen name="Review" component={MarkAttendanceScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tabs.Navigator>
  );
}

export default function App() {
  return (
    <AttendanceTrackerApp />
  );
}

function AttendanceTrackerApp() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [started, setStarted] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [fontTimedOut, setFontTimedOut] = useState(false);

  useEffect(() => {
    // Fallback timer for fonts so slow network font downloads don't block app launch
    const fontTimer = setTimeout(() => setFontTimedOut(true), 3000);

    // Deferred analytics tracking
    const analyticsTimer = setTimeout(() => {
      trackAppOpen().catch((err) => {
        if (__DEV__) console.log('[Analytics] Error in startup tracking:', err);
      });
    }, 2000);

    (async () => {
      try {
        const db = await getDb();
        await runMigrations(db);
      } catch (err) {
        console.error('Failed to initialize database:', err);
      } finally {
        setDbReady(true);
      }
    })();

    return () => {
      clearTimeout(fontTimer);
      clearTimeout(analyticsTimer);
    };
  }, []);

  const fontsReady = fontsLoaded || fontError != null || fontTimedOut;

  if (!fontsReady || !dbReady) return null;
  if (!started)
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <OnboardingScreen onGetStarted={() => setStarted(true)} />
      </SafeAreaProvider>
    );

  return (
    <SafeAreaProvider>
      <AttendanceProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator>
            <Stack.Screen name="Dashboard" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen
              name="Add"
              component={AddSubjectScreen}
              options={({ route }: any) => ({
                title: route.params?.subjectId ? 'Edit subject' : 'Add subject',
              })}
            />
            <Stack.Screen name="Detail" component={SubjectDetailScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AttendanceProvider>
    </SafeAreaProvider>
  );
}
