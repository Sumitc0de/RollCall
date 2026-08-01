import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { useAttendance } from '../context/AttendanceContext';
import { subjectRepository, lectureRecordRepository } from '../db';
import type { LectureRecord, LectureStatus, SubjectSummary } from '../types';
import { Screen } from '../components/Screen';
import { fonts } from '../theme';
import { useAnalytics } from '../analytics/track';

type DashboardCard = {
  record: LectureRecord;
  isScheduledToday: boolean;
};

export function HomeScreen({ navigation }: any) {
  const { refreshKey, refresh, userName } = useAttendance();
  const { track } = useAnalytics();
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [records, setRecords] = useState<LectureRecord[]>([]);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      subjectRepository.getSummaries(),
      lectureRecordRepository.getRecordsForDate(format(new Date(), 'yyyy-MM-dd')),
    ]);
    setSubjects(a);
    setRecords(b);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, refreshKey])
  );

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    track('app_opened');
  }, [track]);

  const mark = async (id: string, x: LectureStatus) => {
    await lectureRecordRepository.updateStatus(id, x);
    await refresh();
    load();
  };

  const { pct, target } = useMemo(() => {
    const p = subjects.reduce((x, a) => x + a.present, 0);
    const t = subjects.reduce((x, a) => x + a.total, 0);
    return {
      pct: t ? Math.round((p / t) * 100) : null,
      target: subjects.length
        ? Math.round(subjects.reduce((x, a) => x + a.target_percent, 0) / subjects.length)
        : 75,
    };
  }, [subjects]);

  const below = pct === null ? 0 : Math.max(0, target - pct);

  useEffect(() => {
    if (below > 0) {
      const affectedSubjectCount = subjects.filter(
        (subject) => subject.total > 0 && (subject.present / subject.total) * 100 < subject.target_percent
      ).length;
      track('defaulter_warning_shown', { affected_subject_count: affectedSubjectCount });
    }
  }, [below, subjects, track]);

  const canMiss =
    pct === null
      ? 0
      : Math.max(
          0,
          Math.floor(
            (subjects.reduce((x, a) => x + a.present, 0) / target) * 100 -
              subjects.reduce((x, a) => x + a.total, 0)
          )
        );

  const dashboardCards = useMemo<DashboardCard[]>(() => {
    const scheduledSubjectIds = new Set(records.map((record) => record.subject_id));
    const unscheduledSubjects = subjects
      .filter((subject) => !scheduledSubjectIds.has(subject.id))
      .map<DashboardCard>((subject) => ({
        isScheduledToday: false,
        record: {
          id: subject.id,
          subject_id: subject.id,
          subject_name: subject.name,
          target_percent: subject.target_percent,
          subject_present: subject.present,
          subject_total: subject.total,
          date: format(new Date(), 'yyyy-MM-dd'),
          status: 'unmarked',
          created_at: subject.created_at,
        },
      }));

    return [
      ...records.map((record) => ({ record, isScheduledToday: true })),
      ...unscheduledSubjects,
    ];
  }, [records, subjects]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={s.page}>
        <View style={s.head}>
          <View>
            <Text style={s.hi}>Hi, {userName} 👋</Text>
            <Text style={s.tag}>Let's keep your attendance on track!</Text>
          </View>
          <Pressable onPress={() => navigation.navigate('Profile')} accessibilityRole="button" accessibilityLabel="Open Profile">
            <Image source={require('../assets/icon.png')} style={s.avatar} />
          </Pressable>
        </View>

        <View style={s.summary}>
          <View style={s.ring}>
            <Text style={s.percent}>{pct === null ? '—' : `${pct}%`}</Text>
            <Text style={s.muted}>Overall</Text>
          </View>
          <View>
            <Text style={s.summaryTitle}>Your Attendance</Text>
            <Text style={s.status}>{pct === null ? 'Start tracking' : pct >= target ? 'Great job! 🎉' : 'Keep going!'}</Text>
            <Text style={s.muted}>Keep it above {target}%</Text>
          </View>

          <View style={s.alerts}>
            {pct !== null && below > 0 && (
              <Insight
                icon="!"
                tone="warn"
                text={
                  <>
                    You are <Text style={s.red}>{below}% below</Text> your target ({target}%).
                    {'\n'}Attend more lectures to reach it.
                  </>
                }
              />
            )}
            <Insight
              icon="✓"
              tone="good"
              text={
                canMiss > 0 ? (
                  <>
                    Good news! You can miss <Text style={s.green}>{canMiss} more</Text> lectures and still maintain {target}%.
                  </>
                ) : (
                  <>Keep marking lectures to see your attendance insights.</>
                )
              }
            />
          </View>
        </View>

        <View style={s.row}>
          <Text style={s.heading}>Today's Subjects</Text>
          <Text style={s.date}>{format(new Date(), 'dd MMM, EEE')}</Text>
        </View>

        {dashboardCards.length ? (
          dashboardCards.map(({ record, isScheduledToday }, i) => (
            <Card
              key={`${record.subject_id}-${record.id}`}
              record={record}
              index={i}
              mark={mark}
              isScheduledToday={isScheduledToday}
              open={() => navigation.navigate('Detail', { subjectId: record.subject_id })}
            />
          ))
        ) : (
          <Text style={s.empty}>Add a subject to start tracking attendance.</Text>
        )}

        <Pressable style={s.add} onPress={() => navigation.navigate('Add')}>
          <Ionicons name="add-circle-outline" size={38} color="#6654F4" />
          <View>
            <Text style={s.addTitle}>Add New Subject</Text>
            <Text style={s.muted}>Add a subject to start tracking</Text>
          </View>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Insight({ icon, tone, text }: { icon: string; tone: 'warn' | 'good'; text: any }) {
  return (
    <View style={[s.insight, tone === 'warn' ? s.warn : s.good]}>
      <Text style={[s.insightIcon, tone === 'warn' ? s.red : s.green]}>{icon}</Text>
      <Text style={s.insightText}>{text}</Text>
      <Ionicons name="chevron-forward" size={21} color="#77719C" />
    </View>
  );
}

function Card({ record, index, mark, open, isScheduledToday }: { record: LectureRecord; index: number; mark: (id: string, x: LectureStatus) => void; open: () => void; isScheduledToday: boolean }) {
  const present = record.status === 'present';
  const absent = record.status === 'absent';

  const total = record.subject_total ?? 0;
  const pCount = record.subject_present ?? 0;
  const target = record.target_percent ?? 75;
  const percent = total > 0 ? Math.round((pCount / total) * 100) : null;
  const isBelowTarget = percent !== null && percent < target;

  return (
    <Pressable style={[s.card, isBelowTarget && s.cardBelowTarget]} onPress={open}>
      <View style={[s.course, { backgroundColor: isBelowTarget ? '#FEF2F2' : index % 2 ? '#E9F8ED' : '#EEEAFF' }]}>
        <Ionicons
          name={isBelowTarget ? 'alert-circle' : index % 2 ? 'server' : 'book'}
          size={31}
          color={isBelowTarget ? '#EF4444' : index % 2 ? '#2CAF5D' : '#6954F7'}
        />
      </View>

      <View style={s.copy}>
        <View style={s.titleRow}>
          <Text style={s.name} numberOfLines={1}>
            {record.subject_name}
          </Text>
          {percent !== null && (
            <View style={[s.percentBadge, isBelowTarget ? s.percentBadgeLow : s.percentBadgeGood]}>
              <Text style={[s.percentBadgeText, isBelowTarget ? s.percentTextLow : s.percentTextGood]}>
                {percent}%
              </Text>
            </View>
          )}
        </View>

        <Text style={[s.info, isBelowTarget && s.infoLow]}>
          {percent === null
            ? '◷  No lectures held yet'
            : isBelowTarget
            ? `⚠️  Low: ${percent}% (Target ${target}%)`
            : `✓  Attendance: ${percent}%`}
        </Text>
        <Text style={s.info}>♙  Tap to view details</Text>
      </View>

      {!isScheduledToday ? (
        <View style={s.notScheduled}>
          <Text style={s.notScheduledText}>Not scheduled{`\n`}today</Text>
        </View>
      ) : present || absent ? (
        <View style={[s.pill, present ? s.present : s.absent]}>
          <Text style={present ? s.presentText : s.absentText}>{present ? '✓  Present' : '×  Absent'}</Text>
        </View>
      ) : (
        <View style={s.actions}>
          <Pressable style={s.present} onPress={() => mark(record.id, 'present')}>
            <Text style={s.presentText}>✓ Present</Text>
          </Pressable>
          <Pressable style={s.absent} onPress={() => mark(record.id, 'absent')}>
            <Text style={s.absentText}>× Absent</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  page: { padding: 22, paddingBottom: 115, gap: 14, backgroundColor: '#FCFBFF' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hi: { fontSize: 28, color: '#17104A', fontFamily: fonts.strong },
  tag: { fontSize: 14, color: '#77719C', fontFamily: fonts.medium, marginTop: 5 },
  avatar: { width: 62, height: 62, borderRadius: 31 },
  summary: { backgroundColor: '#F4F1FF', borderRadius: 28, padding: 20, gap: 15 },
  ring: { width: 126, height: 126, borderRadius: 63, borderWidth: 9, borderColor: '#7358FA', borderLeftColor: '#CEC7FF', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  percent: { fontSize: 34, color: '#17104A', fontFamily: fonts.strong },
  muted: { fontSize: 13, color: '#77719C', fontFamily: fonts.medium },
  summaryTitle: { fontSize: 22, color: '#17104A', fontFamily: fonts.strong, position: 'absolute', left: 150, top: -118 },
  status: { fontSize: 18, color: '#6654F4', fontFamily: fonts.display, position: 'absolute', left: 150, top: -81 },
  alerts: { gap: 10 },
  insight: { borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  warn: { backgroundColor: '#FFF2EF', borderColor: '#FFDCD5', borderWidth: 1 },
  good: { backgroundColor: '#EDF9F1', borderColor: '#DAF1E1', borderWidth: 1 },
  insightIcon: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', textAlign: 'center', paddingTop: 5, fontSize: 18, fontFamily: fonts.strong, backgroundColor: '#fff' },
  insightText: { flex: 1, color: '#252047', fontSize: 13, lineHeight: 19, fontFamily: fonts.medium },
  red: { color: '#F14D43' },
  green: { color: '#2CAF5D' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  heading: { fontSize: 21, color: '#17104A', fontFamily: fonts.strong },
  date: { fontSize: 13, color: '#6654F4', fontFamily: fonts.display },
  card: { minHeight: 132, backgroundColor: '#fff', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#514990', shadowOpacity: 0.08, shadowRadius: 12 },
  cardBelowTarget: {
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FFF8F8',
    shadowColor: '#EF4444',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 6,
  },
  percentBadgeGood: {
    backgroundColor: '#ECFDF5',
  },
  percentBadgeLow: {
    backgroundColor: '#FEF2F2',
  },
  percentBadgeText: {
    fontFamily: fonts.strong,
    fontSize: 12,
  },
  percentTextGood: {
    color: '#16A34A',
  },
  percentTextLow: {
    color: '#DC2626',
  },
  infoLow: {
    color: '#DC2626',
    fontFamily: fonts.strong,
  },
  course: { width: 64, height: 88, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 14, gap: 7 },
  name: { fontSize: 18, color: '#17104A', fontFamily: fonts.strong, flex: 1 },
  info: { fontSize: 12, color: '#837DAC', fontFamily: fonts.medium },
  actions: { width: 104, gap: 8 },
  pill: { width: 104, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notScheduled: { width: 104, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F1FA', paddingHorizontal: 6 },
  notScheduledText: { fontSize: 12, color: '#77719C', fontFamily: fonts.display, textAlign: 'center', lineHeight: 16 },
  present: { backgroundColor: '#EAF8EF', borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 44 },
  absent: { backgroundColor: '#FFF0F0', borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 44 },
  presentText: { fontSize: 13, color: '#32AE5A', fontFamily: fonts.display },
  absentText: { fontSize: 13, color: '#FB5B5F', fontFamily: fonts.display },
  empty: { color: '#77719C', fontFamily: fonts.medium },
  add: { height: 100, borderRadius: 21, borderWidth: 1.5, borderColor: '#CFC6FF', borderStyle: 'dashed', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 5 },
  addTitle: { fontSize: 18, color: '#6654F4', fontFamily: fonts.strong },
});
