import { useEffect, useState } from 'react';
import { Alert, Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { useAttendance } from '../context/AttendanceContext';
import { subjectRepository, scheduleRepository } from '../db';
import { Screen } from '../components/Screen';
import { colors, layout } from '../theme';
import { useAnalytics } from '../analytics/track';

const WEEKDAYS = [
  { day: 1, short: 'Mon', full: 'Monday' }, { day: 2, short: 'Tue', full: 'Tuesday' },
  { day: 3, short: 'Wed', full: 'Wednesday' }, { day: 4, short: 'Thu', full: 'Thursday' },
  { day: 5, short: 'Fri', full: 'Friday' },
];

export function AddSubjectScreen({ navigation, route }: any) {
  const subjectId = route.params?.subjectId as string | undefined;
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

  useEffect(() => {
    if (!subjectId) return;
    (async () => {
      const subject = await subjectRepository.getById(subjectId);
      const schedule = await scheduleRepository.getBySubject(subjectId);
      if (subject) {
        setName(subject.name);
        setTarget(String(subject.target_percent));
        setStart(subject.semester_start_date);
        setDays(Object.fromEntries(schedule.map(s => [s.day_of_week, s.lectures_count])));
      }
    })();
  }, [subjectId]);

  const toggleDay = (day: number) => setDays((old) => old[day] ? Object.fromEntries(Object.entries(old).filter(([key]) => Number(key) !== day)) : { ...old, [day]: 1 });
  const changeCount = (day: number, delta: number) => setDays((old) => ({ ...old, [day]: Math.max(1, Math.min(3, old[day] + delta)) }));

  const save = async () => {
    const targetNumber = Number(target);
    if (!name.trim()) return Alert.alert('Add a subject name');
    if (!Number.isInteger(targetNumber) || targetNumber < 75 || targetNumber > 100) return Alert.alert('Set a target between 75% and 100%. Most colleges require at least 75%.');
    if (!Object.keys(days).length) return Alert.alert('Choose at least one class day.');

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

  const addExtraDate = (value: Date) => setExtraLectures((old) => [...old, format(value, 'yyyy-MM-dd')]);

  return (
    <Screen keyboard>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" onScrollBeginDrag={Keyboard.dismiss}>
        <View style={[styles.content, width >= layout.maxContentWidth && styles.wideContent]}>
          <View style={styles.intro}>
            <View style={styles.introCopy}>
              <Text style={styles.title}>{subjectId ? 'Update Subject' : 'Add New Subject'}</Text>
              <Text style={styles.subtitle}>Add your subject details to{`\n`}start tracking attendance.</Text>
            </View>
            <Image source={require('../assets/icon.png')} style={styles.mascot} resizeMode="contain"/>
          </View>

          <Text style={styles.label}>Subject name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="e.g. Data Structures" placeholderTextColor="#9aa4b6" style={styles.input} autoCapitalize="words" autoComplete="off" returnKeyType="next" accessibilityLabel="Subject name" accessibilityHint="Enter the name of this subject" />

          <Text style={styles.label}>Attendance target</Text>
          <View style={styles.targetWrap}>
            <TextInput value={target} onChangeText={setTarget} keyboardType="number-pad" maxLength={3} style={styles.targetInput} accessibilityLabel="Attendance target percentage" />
            <Text style={styles.targetSuffix}>%</Text>
          </View>
          <Text style={styles.targetHint}>Choose 75%, 80%, or 85% based on your college requirement.</Text>

          <Text style={styles.label}>Semester began</Text>
          <Pressable style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]} onPress={() => setPicker(true)} accessibilityRole="button" accessibilityLabel="Choose semester start date">
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
                setStart(format(value, 'yyyy-MM-dd'));
              }}
              onDismiss={() => setPicker(false)}
              onError={() => setPicker(false)}
            />
          )}

          <View style={styles.scheduleHeader}>
            <Text style={styles.label}>Weekly lectures</Text>
            <Text style={styles.scheduleNote}>Monday to Friday are selected by default</Text>
          </View>

          <View style={styles.days}>
            {WEEKDAYS.map(({ day, short }) => (
              <View key={short}>
                <Pressable style={[styles.day, !!days[day] && styles.dayActive]} onPress={() => toggleDay(day)}>
                  <View style={[styles.check, !!days[day] && styles.checkActive]}>
                    <Text style={styles.checkText}>{days[day] ? '✓' : ''}</Text>
                  </View>
                  <View style={styles.dayInfo}>
                    <Text style={[styles.dayName, !!days[day] && styles.activeText]}>{short}</Text>
                    <Text style={styles.dayDescription}>{short} classes</Text>
                  </View>
                  {!!days[day] && <Text style={styles.selected}>Selected</Text>}
                </Pressable>
                {!!days[day] && (
                  <View style={styles.periodRow}>
                    <Text style={styles.periodLabel}>Lectures on {short}</Text>
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepButton} onPress={() => changeCount(day, -1)}><Text style={styles.step}>−</Text></Pressable>
                      <Text style={styles.count}>{days[day]}</Text>
                      <Pressable style={styles.stepButton} onPress={() => changeCount(day, 1)}><Text style={styles.step}>+</Text></Pressable>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.extraSection}>
            <View>
              <Text style={styles.extraTitle}>Optional extra lecture</Text>
              <Text style={styles.extraHint}>Add a one-off class with a date from your calendar.</Text>
            </View>
            <Pressable style={styles.extraAdd} onPress={() => setExtraPicker(true)}>
              <Text style={styles.extraAddText}>+ Add date</Text>
            </Pressable>
          </View>

          {extraPicker && (
            <DateTimePicker
              value={new Date()}
              maximumDate={new Date()}
              onValueChange={(_, value) => {
                setExtraPicker(false);
                addExtraDate(value);
              }}
              onDismiss={() => setExtraPicker(false)}
              onError={() => setExtraPicker(false)}
            />
          )}

          {extraLectures.map((date, index) => (
            <View key={`${date}-${index}`} style={styles.extraDate}>
              <View>
                <Text style={styles.extraDateTitle}>{format(parseISO(date), 'EEEE, dd MMM yyyy')}</Text>
                <Text style={styles.extraDateCaption}>One extra lecture</Text>
              </View>
              <Pressable onPress={() => setExtraLectures((old) => old.filter((_, itemIndex) => itemIndex !== index))}>
                <Text style={styles.removeExtra}>Remove</Text>
              </Pressable>
            </View>
          ))}

          <Pressable style={({ pressed }) => [styles.save, (saving || pressed) && styles.disabled]} onPress={save} disabled={saving} accessibilityRole="button" accessibilityLabel={subjectId ? 'Save subject changes' : 'Add subject'}>
            <Text style={styles.saveText}>{saving ? 'Saving…' : subjectId ? 'Save changes' : 'Add subject'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 36, backgroundColor: colors.background, flexGrow: 1 },
  content: { width: '100%', gap: 10 },
  wideContent: { maxWidth: layout.maxContentWidth, alignSelf: 'center' },
  intro: { marginBottom: 8 },
  introCopy: {},
  mascot: {},
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5, color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 5, lineHeight: 20 },
  label: { fontWeight: '800', marginTop: 12, color: '#27314a', fontSize: 14 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, color: colors.text },
  targetWrap: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
  targetInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16, color: colors.text },
  targetSuffix: { fontSize: 18, fontWeight: '800', color: '#64748b', paddingRight: 16 },
  targetHint: { fontSize: 12, color: '#7a8498', marginTop: -4 },
  dateButton: { minHeight: 48, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center' },
  pressed: { opacity: 0.72 },
  calendar: { color: colors.primary, fontSize: 18, marginRight: 10 },
  dateText: { flex: 1, color: '#27314a', fontWeight: '600' },
  chevron: { fontSize: 28, color: '#9aa4b6', lineHeight: 22 },
  scheduleHeader: { marginTop: 7 },
  scheduleNote: { fontSize: 12, color: '#7a8498', marginTop: 4 },
  days: { gap: 9 },
  day: { minHeight: 52, backgroundColor: colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  dayActive: { borderColor: '#6d63e8', backgroundColor: '#f7f6ff' },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#c6cedc', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  dayInfo: { flex: 1 },
  dayName: { fontWeight: '800', color: '#34415b', fontSize: 15 },
  dayDescription: { fontSize: 12, color: '#8a94a6', marginTop: 2 },
  activeText: { color: '#3730a3' },
  selected: { fontSize: 12, fontWeight: '800', color: colors.primary },
  periodRow: { backgroundColor: '#ecebff', paddingVertical: 9, paddingLeft: 14, paddingRight: 8, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, marginTop: -12, marginHorizontal: 1, paddingTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periodLabel: { fontWeight: '700', fontSize: 13, color: '#4d4990' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 2 },
  stepButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  step: { fontSize: 23, color: colors.primary, fontWeight: '700' },
  count: { fontWeight: '800', minWidth: 18, textAlign: 'center', color: '#27314a' },
  extraSection: { marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  extraTitle: { fontWeight: '800', fontSize: 16, color: '#27314a' },
  extraHint: { fontSize: 12, color: '#7a8498', marginTop: 3 },
  extraAdd: { minHeight: 44, backgroundColor: '#e9e8ff', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, justifyContent: 'center' },
  extraAddText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  extraDate: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  extraDateTitle: { fontWeight: '800', color: '#34415b' },
  extraDateCaption: { fontSize: 12, color: '#8a94a6', marginTop: 3 },
  removeExtra: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  save: { minHeight: 52, backgroundColor: colors.primary, padding: 17, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 22, shadowColor: '#312e81', shadowOpacity: 0.22, shadowRadius: 9, elevation: 3 },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 },
});

Object.assign(styles, {
  page: { ...styles.page, padding: 0, backgroundColor: '#FBFAFF' },
  content: { ...styles.content, gap: 13, padding: 20, paddingTop: 28, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  intro: { ...styles.intro, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F5F2FF', marginHorizontal: -20, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 26, marginTop: -28 },
  introCopy: { flex: 1 },
  mascot: { width: 126, height: 126, marginRight: -8 },
  title: { ...styles.title, fontSize: 30, color: '#17104A', fontFamily: 'Nunito_800ExtraBold' },
  subtitle: { ...styles.subtitle, fontSize: 16, lineHeight: 24, color: '#6E6896', fontFamily: 'Nunito_600SemiBold' },
  label: { ...styles.label, fontSize: 17, color: '#17104A', fontFamily: 'Nunito_700Bold', marginTop: 16 },
  input: { ...styles.input, borderColor: '#765CFF', borderWidth: 1.5, borderRadius: 17, paddingVertical: 17, fontFamily: 'Nunito_600SemiBold' },
  targetWrap: { ...styles.targetWrap, borderColor: '#D8D3E8', borderRadius: 17 },
  targetInput: { ...styles.targetInput, paddingVertical: 17, fontFamily: 'Nunito_700Bold' },
  days: { ...styles.days, flexDirection: 'row', gap: 8 },
  day: { ...styles.day, width: 51, minHeight: 88, padding: 7, justifyContent: 'space-between', flexDirection: 'column', alignItems: 'center', borderRadius: 16 },
  dayInfo: { ...styles.dayInfo, flex: 0 },
  dayName: { ...styles.dayName, fontSize: 14 },
  dayDescription: { display: 'none' },
  selected: { display: 'none' },
  check: { ...styles.check, marginRight: 0 },
  periodRow: { ...styles.periodRow, display: 'none' },
  extraSection: { ...styles.extraSection, backgroundColor: '#F5F2FF', padding: 15, borderRadius: 17, marginTop: 10 },
  extraAdd: { ...styles.extraAdd, backgroundColor: '#6650F7', borderRadius: 12 },
  extraAddText: { ...styles.extraAddText, color: '#fff' },
  save: { ...styles.save, backgroundColor: '#6650F7', borderRadius: 18, minHeight: 61, marginTop: 24 },
  saveText: { ...styles.saveText, fontSize: 19, fontFamily: 'Nunito_700Bold' },
});
