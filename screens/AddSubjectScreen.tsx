import { useEffect, useState } from 'react';
import { Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { useAttendance } from '../context/AttendanceContext';
import { subjectRepository, scheduleRepository } from '../db';
import { Screen } from '../components/Screen';
import { ConfirmModal } from '../components/ConfirmModal';
import { colors, fonts, layout } from '../theme';
import { useAnalytics } from '../analytics/track';

const WEEKDAYS = [
  { day: 1, short: 'Mon', full: 'Monday' },
  { day: 2, short: 'Tue', full: 'Tuesday' },
  { day: 3, short: 'Wed', full: 'Wednesday' },
  { day: 4, short: 'Thu', full: 'Thursday' },
  { day: 5, short: 'Fri', full: 'Friday' },
];

export function AddSubjectScreen({ navigation, route }: any) {
  const subjectId = route.params?.subjectId as string | undefined;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { refresh } = useAttendance();
  const { track } = useAnalytics();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('75');
  const [start, setStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [days, setDays] = useState<Record<number, number>>({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 });
  const [picker, setPicker] = useState(false);
  const [extraPicker, setExtraPicker] = useState(false);
  const [extraLectures, setExtraLectures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorModal, setErrorModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    if (!subjectId) return;
    (async () => {
      const subject = await subjectRepository.getById(subjectId);
      const schedule = await scheduleRepository.getBySubject(subjectId);
      if (subject) {
        setName(subject.name);
        setTarget(String(subject.target_percent));
        setStart(subject.semester_start_date);
        setDays(Object.fromEntries(schedule.map((s) => [s.day_of_week, s.lectures_count])));
      }
    })();
  }, [subjectId]);

  const toggleDay = (day: number) =>
    setDays((old) =>
      old[day]
        ? Object.fromEntries(Object.entries(old).filter(([key]) => Number(key) !== day))
        : { ...old, [day]: 1 }
    );

  const save = async () => {
    const targetNumber = Number(target);
    if (!name.trim()) {
      return setErrorModal({
        visible: true,
        title: 'Subject Name Missing',
        message: 'Please enter a name for this subject before saving.',
      });
    }
    if (!Number.isInteger(targetNumber) || targetNumber < 75 || targetNumber > 100) {
      return setErrorModal({
        visible: true,
        title: 'Invalid Target',
        message: 'Set an attendance target between 75% and 100%. Most colleges require at least 75%.',
      });
    }
    if (!Object.keys(days).length) {
      return setErrorModal({
        visible: true,
        title: 'No Days Selected',
        message: 'Choose at least one weekly class day for this subject.',
      });
    }

    setSaving(true);
    const payload = Object.entries(days).map(([day, count]) => ({ day: Number(day), count }));

    try {
      if (subjectId) {
        await subjectRepository.updateWithSchedule(
          subjectId,
          { name: name.trim(), target_percent: targetNumber, semester_start_date: start },
          payload,
          extraLectures
        );
      } else {
        await subjectRepository.createWithSchedule(
          { name: name.trim(), target_percent: targetNumber, semester_start_date: start },
          payload,
          extraLectures
        );
        track('subject_added', { has_double_period: payload.some((item) => item.count > 1) });
      }
      await refresh();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const addExtraDate = (value: Date) =>
    setExtraLectures((old) => [...old, format(value, 'yyyy-MM-dd')]);

  return (
    <Screen keyboard edges={['left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.page, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <View style={[styles.content, width >= layout.maxContentWidth && styles.wideContent]}>
          <View style={styles.intro}>
            <View style={styles.introCopy}>
              <Text style={styles.title}>{subjectId ? 'Update Subject' : 'Add New Subject'}</Text>
              <Text style={styles.subtitle}>
                Add your subject details to{`\n`}start tracking attendance.
              </Text>
            </View>
            <Image
              source={require('../assets/icon.png')}
              style={styles.mascot}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.label}>Subject name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Data Structures"
            placeholderTextColor="#9aa4b6"
            style={styles.input}
            autoCapitalize="words"
            autoComplete="off"
            returnKeyType="next"
            accessibilityLabel="Subject name"
            accessibilityHint="Enter the name of this subject"
          />

          <Text style={styles.label}>Attendance target</Text>
          <View style={styles.targetWrap}>
            <TextInput
              value={target}
              onChangeText={setTarget}
              keyboardType="number-pad"
              maxLength={3}
              style={styles.targetInput}
              accessibilityLabel="Attendance target percentage"
            />
            <Text style={styles.targetSuffix}>%</Text>
          </View>
          <Text style={styles.targetHint}>
            Choose 75%, 80%, or 85% based on your college requirement.
          </Text>

          <Text style={styles.label}>Semester began</Text>
          <Pressable
            style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
            onPress={() => setPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Choose semester start date"
          >
            <Text style={styles.calendar}>▣</Text>
            <Text style={styles.dateText}>{format(parseISO(start), 'EEEE, dd MMM yyyy')}</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          {picker && (
            <DateTimePicker
              value={parseISO(start)}
              maximumDate={new Date()}
              onValueChange={(_, value) => {
                setPicker(false);
                if (value) setStart(format(value, 'yyyy-MM-dd'));
              }}
              onDismiss={() => setPicker(false)}
              onError={() => setPicker(false)}
            />
          )}

          <View style={styles.scheduleHeader}>
            <Text style={styles.label}>Weekly lectures</Text>
            <Text style={styles.scheduleNote}>Monday to Friday are selected by default</Text>
          </View>

          <View style={styles.daysRow}>
            {WEEKDAYS.map(({ day, short, full }) => {
              const active = !!days[day];
              return (
                <Pressable
                  key={short}
                  style={[styles.dayCard, active && styles.dayCardActive]}
                  onPress={() => toggleDay(day)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`Select ${full}`}
                >
                  <View style={[styles.checkCircle, active && styles.checkCircleActive]}>
                    <Text style={styles.checkIcon}>{active ? '✓' : ''}</Text>
                  </View>
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{short}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.extraSection}>
            <View style={styles.extraTextWrapper}>
              <Text style={styles.extraTitle}>Optional extra lecture</Text>
              <Text style={styles.extraHint}>Add a one-off class with a date from your calendar.</Text>
            </View>
            <Pressable
              style={styles.extraAdd}
              onPress={() => setExtraPicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Add extra lecture date"
            >
              <Text style={styles.extraAddText}>+ Add date</Text>
            </Pressable>
          </View>

          {extraPicker && (
            <DateTimePicker
              value={new Date()}
              maximumDate={new Date()}
              onValueChange={(_, value) => {
                setExtraPicker(false);
                if (value) addExtraDate(value);
              }}
              onDismiss={() => setExtraPicker(false)}
              onError={() => setExtraPicker(false)}
            />
          )}

          {extraLectures.map((date, index) => (
            <View key={`${date}-${index}`} style={styles.extraDate}>
              <View>
                <Text style={styles.extraDateTitle}>
                  {format(parseISO(date), 'EEEE, dd MMM yyyy')}
                </Text>
                <Text style={styles.extraDateCaption}>One extra lecture</Text>
              </View>
              <Pressable
                onPress={() =>
                  setExtraLectures((old) => old.filter((_, itemIndex) => itemIndex !== index))
                }
                accessibilityRole="button"
                accessibilityLabel="Remove extra lecture"
              >
                <Text style={styles.removeExtra}>Remove</Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [styles.save, (saving || pressed) && styles.disabled]}
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={subjectId ? 'Save subject changes' : 'Add subject'}
          >
            <Text style={styles.saveText}>
              {saving ? 'Saving…' : subjectId ? 'Save changes' : 'Add subject'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={errorModal.visible}
        title={errorModal.title}
        message={errorModal.message}
        icon="alert-circle-outline"
        iconColor="#EF4444"
        iconBg="#FEF2F2"
        confirmText="Got It"
        confirmTone="danger"
        onConfirm={() => setErrorModal((prev) => ({ ...prev, visible: false }))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#FBFAFF',
    flexGrow: 1,
  },
  content: {
    width: '100%',
    gap: 13,
    padding: 20,
    paddingTop: 28,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  wideContent: {
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F2FF',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 26,
    marginTop: -28,
  },
  introCopy: {
    flex: 1,
  },
  mascot: {
    width: 126,
    height: 126,
    marginRight: -8,
  },
  title: {
    fontSize: 30,
    color: '#17104A',
    fontFamily: fonts.display,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6E6896',
    fontFamily: fonts.medium,
    marginTop: 5,
  },
  label: {
    fontSize: 17,
    color: '#17104A',
    fontFamily: fonts.strong,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: '#765CFF',
    borderWidth: 1.5,
    borderRadius: 17,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.medium,
  },
  targetWrap: {
    backgroundColor: colors.surface,
    borderColor: '#D8D3E8',
    borderWidth: 1.5,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetInput: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.strong,
  },
  targetSuffix: {
    fontSize: 18,
    fontFamily: fonts.strong,
    color: '#64748b',
    paddingRight: 16,
  },
  targetHint: {
    fontSize: 12,
    color: '#7a8498',
    fontFamily: fonts.medium,
    marginTop: -4,
  },
  dateButton: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#D8D3E8',
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  calendar: {
    color: '#6650F7',
    fontSize: 18,
    marginRight: 10,
  },
  dateText: {
    flex: 1,
    color: '#27314a',
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  chevron: {
    fontSize: 28,
    color: '#9aa4b6',
    lineHeight: 22,
  },
  scheduleHeader: {
    marginTop: 7,
  },
  scheduleNote: {
    fontSize: 12,
    color: '#7a8498',
    fontFamily: fonts.medium,
    marginTop: 4,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  dayCard: {
    flex: 1,
    minHeight: 84,
    padding: 8,
    justifyContent: 'space-between',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  dayCardActive: {
    borderColor: '#6650F7',
    backgroundColor: '#F5F2FF',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#6650F7',
    borderColor: '#6650F7',
  },
  checkIcon: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  dayText: {
    fontSize: 14,
    fontFamily: fonts.strong,
    color: '#64748B',
  },
  dayTextActive: {
    color: '#17104A',
  },
  extraSection: {
    backgroundColor: '#F5F2FF',
    padding: 15,
    borderRadius: 17,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  extraTextWrapper: {
    flex: 1,
    marginRight: 10,
  },
  extraTitle: {
    fontFamily: fonts.strong,
    fontSize: 15,
    color: '#17104A',
  },
  extraHint: {
    fontSize: 12,
    color: '#7a8498',
    fontFamily: fonts.medium,
    marginTop: 3,
  },
  extraAdd: {
    minHeight: 44,
    backgroundColor: '#6650F7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    justifyContent: 'center',
  },
  extraAddText: {
    color: '#fff',
    fontFamily: fonts.strong,
    fontSize: 13,
  },
  extraDate: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  extraDateTitle: {
    fontFamily: fonts.strong,
    color: '#34415b',
  },
  extraDateCaption: {
    fontSize: 12,
    color: '#8a94a6',
    fontFamily: fonts.medium,
    marginTop: 3,
  },
  removeExtra: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: fonts.strong,
  },
  save: {
    minHeight: 61,
    backgroundColor: '#6650F7',
    padding: 17,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#5140D7',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  saveText: {
    color: '#fff',
    fontSize: 19,
    fontFamily: fonts.strong,
  },
  disabled: {
    opacity: 0.6,
  },
});
