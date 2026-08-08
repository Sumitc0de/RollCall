import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { userSettingsRepository } from '../db';
import { Screen } from '../components/Screen';
import { fonts } from '../theme';

export function OnboardingScreen({ onGetStarted }: { onGetStarted: () => void }) {
    const [name, setName] = useState('');
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);

    const handleFocus = () => {
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 150);
    };

    const handleStart = async () => {
        const trimmed = name.trim();
        if (trimmed) {
            await userSettingsRepository.setSetting('user_name', trimmed);
        }
        await userSettingsRepository.setSetting('onboarding_completed', 'true');
        await AsyncStorage.setItem('@rollcall_onboarding_completed', 'true');
        onGetStarted();
    };

    return (
        <Screen keyboard edges={['top', 'bottom', 'left', 'right']}>
            <View style={s.root}>
                <View style={[s.orb, s.top]} />
                <View style={[s.orb, s.side]} />

                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={[
                        s.scrollContent,
                        { paddingBottom: Math.max(insets.bottom, 24) + 60 }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Image source={require('../assets/icon.png')} style={s.mascot} resizeMode="contain" />

                    <View style={s.headerTextGroup}>
                        <Text style={s.title}>
                            Track Attendance,{`\n`}
                            <Text style={s.accent}>Achieve More!</Text>
                        </Text>
                        <Text style={s.subtitle}>
                            Stay on top of your classes, track your{`\n`}attendance, and never miss a moment.
                        </Text>
                    </View>

                    <View style={s.card}>
                        <Text style={s.ask}>What should we call you?</Text>
                        <Text style={s.askHint}>We'll make your attendance journey feel personal.</Text>
                        <View style={s.field}>
                            <Ionicons name="person-outline" size={22} color="#6650F7" />
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                onFocus={handleFocus}
                                placeholder="Your name"
                                placeholderTextColor="#948EAF"
                                style={s.input}
                                autoCapitalize="words"
                                returnKeyType="done"
                                onSubmitEditing={handleStart}
                                accessibilityLabel="Your name"
                                accessibilityHint="Enter your name to personalize your experience"
                            />
                        </View>

                        <Pressable
                            style={({ pressed }) => [s.button, pressed && s.pressed]}
                            onPress={handleStart}
                            accessibilityRole="button"
                            accessibilityLabel="Get Started"
                            accessibilityHint="Completes onboarding and opens dashboard"
                        >
                            <Text style={s.buttonText}>Get Started</Text>
                            <Ionicons name="arrow-forward" size={24} color="#fff" />
                        </Pressable>
                    </View>
                </ScrollView>
            </View>
        </Screen>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FBF9FF',
        overflow: 'hidden',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        justifyContent: 'center',
        gap: 16,
    },
    orb: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: '#F4F0FF',
        borderWidth: 1,
        borderColor: '#EFEAFF',
    },
    top: { width: 330, height: 330, left: -150, top: -160 },
    side: { width: 240, height: 240, right: -105, top: 55 },
    mascot: {
        width: 120,
        height: 120,
        alignSelf: 'center',
    },
    headerTextGroup: {
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        fontSize: 28,
        lineHeight: 36,
        color: '#20164D',
        fontFamily: fonts.strong,
    },
    accent: {
        color: '#6657F5',
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 21,
        color: '#6F6998',
        fontFamily: fonts.medium,
        marginTop: 8,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: '#EDE9FE',
        shadowColor: '#5140D7',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
        marginTop: 4,
    },
    ask: {
        fontSize: 17,
        color: '#20164D',
        fontFamily: fonts.strong,
        textAlign: 'center',
    },
    askHint: {
        fontSize: 13,
        color: '#817AA7',
        fontFamily: fonts.medium,
        textAlign: 'center',
        marginTop: -4,
        marginBottom: 2,
    },
    field: {
        height: 56,
        backgroundColor: '#F9F8FF',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#D9D2FF',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#20164D',
        fontFamily: fonts.medium,
    },
    button: {
        height: 56,
        borderRadius: 18,
        backgroundColor: '#6650F7',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
        shadowColor: '#5140D7',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
    },
    pressed: {
        opacity: 0.9,
        transform: [{ scale: 0.985 }],
    },
    buttonText: {
        fontSize: 18,
        color: '#fff',
        fontFamily: fonts.display,
    },
});
