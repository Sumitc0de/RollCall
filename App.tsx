import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { getDb, runMigrations, userSettingsRepository } from './db';
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
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6654F4',
        tabBarInactiveTintColor: '#8580A9',
        tabBarLabelStyle: {
          fontFamily: 'Nunito_700Bold',
          fontSize: 12,
          marginBottom: Platform.OS === 'android' ? 4 : 0,
        },
        tabBarStyle: {
          height: 60 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0EDFF',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
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
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[RollCall] 🚀 App Mounted. Starting DB initialization...');

    // Non-blocking deferred analytics tracking
    const analyticsTimer = setTimeout(() => {
      trackAppOpen().catch((err) => {
        if (__DEV__) console.log('[Analytics] Non-blocking startup tracking error:', err);
      });
    }, 2000);

    (async () => {
      try {
        console.log('[RollCall] 1/3 Connecting SQLite database...');
        const db = await getDb();
        console.log('[RollCall] 2/3 Running DB migrations...');
        await runMigrations(db);
        console.log('[RollCall] 3/3 Checking onboarding status...');

        const asyncStorageOnboarding = await AsyncStorage.getItem('@rollcall_onboarding_completed');
        const dbOnboarding = await userSettingsRepository.getSetting('onboarding_completed', 'false');
        console.log('[RollCall] Onboarding status:', { asyncStorageOnboarding, dbOnboarding });

        if (asyncStorageOnboarding === 'true' || dbOnboarding === 'true') {
          setStarted(true);
        }
      } catch (err: any) {
        console.error('[RollCall] ❌ Failed to initialize database:', err);
        setInitError(err?.message || String(err));
      } finally {
        setDbReady(true);
      }
    })();

    return () => {
      clearTimeout(analyticsTimer);
    };
  }, []);

  if (initError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FBFAFF', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <ActivityIndicator size="large" color="#EF4444" />
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E1B4B', textAlign: 'center' }}>Initialization Note</Text>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 8 }}>{initError}</Text>
        </View>
      </View>
    );
  }

  if (!fontsLoaded || !dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FBFAFF', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6650F7" />
      </View>
    );
  }

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
