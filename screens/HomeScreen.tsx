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

  const [sortBy, setSortBy] = useState<'default' | 'low_attendance' | 'high_attendance'>('default');
  const [typeFilter, setTypeFilter] = useState<'all' | 'theory' | 'lab'>('all');

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
          subject_type: subject.type,
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

  const filteredAndSortedCards = useMemo(() => {
    let result = [...dashboardCards];

    if (typeFilter !== 'all') {
      result = result.filter((card) => {
        const cardType = card.record.subject_type || 'theory';
        return cardType === typeFilter;
      });
    }

    if (sortBy === 'low_attendance') {
      result.sort((a, b) => {
        const totalA = a.record.subject_total ?? 0;
        const pctA = totalA > 0 ? ((a.record.subject_present ?? 0) / totalA) * 100 : -1;
        const totalB = b.record.subject_total ?? 0;
        const pctB = totalB > 0 ? ((b.record.subject_present ?? 0) / totalB) * 100 : -1;
        return pctA - pctB;
      });
    } else if (sortBy === 'high_attendance') {
      result.sort((a, b) => {
        const totalA = a.record.subject_total ?? 0;
        const pctA = totalA > 0 ? ((a.record.subject_present ?? 0) / totalA) * 100 : -1;
        const totalB = b.record.subject_total ?? 0;
        const pctB = totalB > 0 ? ((b.record.subject_present ?? 0) / totalB) * 100 : -1;
        return pctB - pctA;
      });
    }

    return result;
  }, [dashboardCards, sortBy, typeFilter]);

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
          <View style={s.summaryTopRow}>
            <View style={s.ring}>
              <Text style={s.percent}>{pct === null ? '—' : `${pct}%`}</Text>
              <Text style={s.muted}>Overall</Text>
            </View>
            <View style={s.summaryTextCol}>
              <Text style={s.summaryTitle}>Your Attendance</Text>
              <Text style={s.status}>{pct === null ? 'Start tracking' : pct >= target ? 'Great job! 🎉' : 'Keep going!'}</Text>
              <Text style={s.muted}>Keep it above {target}%</Text>
            </View>
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

        <View style={s.filterSortSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipScroll}>
            <Pressable
              style={[s.chip, sortBy === 'default' && s.chipActive]}
              onPress={() => setSortBy('default')}
              accessibilityRole="button"
              accessibilityLabel="Sort by scheduled subjects"
            >
              <Ionicons name="time-outline" size={13} color={sortBy === 'default' ? '#fff' : '#64748B'} />
              <Text style={[s.chipText, sortBy === 'default' && s.chipTextActive]}>Scheduled</Text>
            </Pressable>

            <Pressable
              style={[s.chip, sortBy === 'low_attendance' && s.chipActiveLow]}
              onPress={() => setSortBy('low_attendance')}
              accessibilityRole="button"
              accessibilityLabel="Sort by low attendance"
            >
              <Ionicons name="arrow-down-circle-outline" size={13} color={sortBy === 'low_attendance' ? '#fff' : '#EF4444'} />
              <Text style={[s.chipText, sortBy === 'low_attendance' && s.chipTextActive]}>Low Attendance</Text>
            </Pressable>

            <Pressable
              style={[s.chip, sortBy === 'high_attendance' && s.chipActiveGood]}
              onPress={() => setSortBy('high_attendance')}
              accessibilityRole="button"
              accessibilityLabel="Sort by high attendance"
            >
              <Ionicons name="arrow-up-circle-outline" size={13} color={sortBy === 'high_attendance' ? '#fff' : '#10B981'} />
              <Text style={[s.chipText, sortBy === 'high_attendance' && s.chipTextActive]}>High Attendance</Text>
            </Pressable>

            <View style={s.chipDivider} />

            <Pressable
              style={[s.chip, typeFilter === 'all' && s.chipActive]}
              onPress={() => setTypeFilter('all')}
              accessibilityRole="button"
              accessibilityLabel="Filter all subject types"
            >
              <Text style={[s.chipText, typeFilter === 'all' && s.chipTextActive]}>All Types</Text>
            </Pressable>

            <Pressable
              style={[s.chip, typeFilter === 'theory' && s.chipActive]}
              onPress={() => setTypeFilter('theory')}
              accessibilityRole="button"
              accessibilityLabel="Filter theory subjects"
            >
              <Ionicons name="book-outline" size={13} color={typeFilter === 'theory' ? '#fff' : '#64748B'} />
              <Text style={[s.chipText, typeFilter === 'theory' && s.chipTextActive]}>Theory</Text>
            </Pressable>

            <Pressable
              style={[s.chip, typeFilter === 'lab' && s.chipActive]}
              onPress={() => setTypeFilter('lab')}
              accessibilityRole="button"
              accessibilityLabel="Filter lab subjects"
            >
              <Ionicons name="flask-outline" size={13} color={typeFilter === 'lab' ? '#fff' : '#64748B'} />
              <Text style={[s.chipText, typeFilter === 'lab' && s.chipTextActive]}>Labs</Text>
            </Pressable>
          </ScrollView>
        </View>

        {filteredAndSortedCards.length ? (
          filteredAndSortedCards.map(({ record, isScheduledToday }, i) => (
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
          <Text style={s.empty}>No subjects found for selected filter.</Text>
        )}

        <Pressable
          style={s.add}
          onPress={() => navigation.navigate('Add')}
          accessibilityRole="button"
          accessibilityLabel="Add New Subject"
          accessibilityHint="Navigates to the add subject screen"
        >
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
  const isLab = record.subject_type === 'lab';

  return (
    <Pressable
      style={[s.card, isBelowTarget && s.cardBelowTarget]}
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={`${record.subject_name}, ${isLab ? 'Lab' : 'Theory'}, attendance ${percent ?? 0} percent`}
      accessibilityHint="Tap to view subject details"
    >
      <View style={[s.course, { backgroundColor: isBelowTarget ? '#FEF2F2' : isLab ? '#FEF3C7' : index % 2 ? '#E9F8ED' : '#EEEAFF' }]}>
        <Ionicons
          name={isBelowTarget ? 'alert-circle' : isLab ? 'flask' : index % 2 ? 'server' : 'book'}
          size={24}
          color={isBelowTarget ? '#EF4444' : isLab ? '#D97706' : index % 2 ? '#2CAF5D' : '#6954F7'}
        />
      </View>

      <View style={s.copy}>
        <View style={s.subjectTitleRow}>
          <Text style={s.name} numberOfLines={2}>
            {record.subject_name}
          </Text>
          <View style={[s.typeBadge, isLab ? s.typeBadgeLab : s.typeBadgeTheory]}>
            <Ionicons
              name={isLab ? 'flask-outline' : 'book-outline'}
              size={10}
              color={isLab ? '#D97706' : '#6366F1'}
            />
            <Text style={[s.typeBadgeText, isLab ? s.typeBadgeTextLab : s.typeBadgeTextTheory]}>
              {isLab ? 'Lab' : 'Theory'}
            </Text>
          </View>
        </View>

        <View style={s.infoRow}>
          <Text style={[s.info, isBelowTarget && s.infoLow]}>
            {percent === null
              ? '◷  No lectures held yet'
              : isBelowTarget
                ? `⚠️  Low: ${percent}%`
                : `✓  Attendance:`}
          </Text>
          {percent !== null && (
            <View style={[s.percentBadge, isBelowTarget ? s.percentBadgeLow : s.percentBadgeGood]}>
              <Text style={[s.percentBadgeText, isBelowTarget ? s.percentTextLow : s.percentTextGood]}>
                {percent}%
              </Text>
            </View>
          )}
        </View>

        <Text style={s.subInfo}>♙  Tap to view details</Text>
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
          <Pressable
            style={s.present}
            onPress={() => mark(record.id, 'present')}
            accessibilityRole="button"
            accessibilityLabel={`Mark present for ${record.subject_name}`}
          >
            <Text style={s.presentText}>✓ Present</Text>
          </Pressable>
          <Pressable
            style={s.absent}
            onPress={() => mark(record.id, 'absent')}
            accessibilityRole="button"
            accessibilityLabel={`Mark absent for ${record.subject_name}`}
          >
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
  summaryTopRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  summaryTextCol: { flex: 1, gap: 4 },
  ring: { width: 104, height: 104, borderRadius: 52, borderWidth: 8, borderColor: '#7358FA', borderLeftColor: '#CEC7FF', alignItems: 'center', justifyContent: 'center' },
  percent: { fontSize: 28, color: '#17104A', fontFamily: fonts.strong },
  muted: { fontSize: 13, color: '#77719C', fontFamily: fonts.medium },
  summaryTitle: { fontSize: 20, color: '#17104A', fontFamily: fonts.strong },
  status: { fontSize: 16, color: '#6654F4', fontFamily: fonts.display },
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
  card: { minHeight: 115, backgroundColor: '#fff', borderRadius: 22, padding: 12, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#514990', shadowOpacity: 0.08, shadowRadius: 12 },
  cardBelowTarget: {
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FFF8F8',
    shadowColor: '#EF4444',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  percentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  percentBadgeGood: {
    backgroundColor: '#ECFDF5',
  },
  percentBadgeLow: {
    backgroundColor: '#FEF2F2',
  },
  percentBadgeText: {
    fontFamily: fonts.strong,
    fontSize: 11,
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
  course: { width: 44, height: 72, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 10, marginRight: 6, gap: 2 },
  name: { fontSize: 16, lineHeight: 21, color: '#17104A', fontFamily: fonts.strong },
  info: { fontSize: 12, color: '#837DAC', fontFamily: fonts.medium },
  subInfo: { fontSize: 11, color: '#A099C8', fontFamily: fonts.medium, marginTop: 1 },
  actions: { width: 86, gap: 6 },
  pill: { width: 86, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  notScheduled: { width: 86, minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F1FA', paddingHorizontal: 3 },
  notScheduledText: { fontSize: 11, color: '#77719C', fontFamily: fonts.display, textAlign: 'center', lineHeight: 14 },
  present: { backgroundColor: '#EAF8EF', borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 42 },
  absent: { backgroundColor: '#FFF0F0', borderRadius: 14, alignItems: 'center', justifyContent: 'center', height: 42 },
  presentText: { fontSize: 12, color: '#32AE5A', fontFamily: fonts.display },
  absentText: { fontSize: 12, color: '#FB5B5F', fontFamily: fonts.display },
  empty: { color: '#77719C', fontFamily: fonts.medium },
  add: { height: 100, borderRadius: 21, borderWidth: 1.5, borderColor: '#CFC6FF', borderStyle: 'dashed', padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 5 },
  addTitle: { fontSize: 18, color: '#6654F4', fontFamily: fonts.strong },
  filterSortSection: {
    marginVertical: 4,
    marginHorizontal: -4,
  },
  chipScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F0FB',
    borderWidth: 1,
    borderColor: '#E2DFFA',
  },
  chipActive: {
    backgroundColor: '#6654F4',
    borderColor: '#6654F4',
  },
  chipActiveLow: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  chipActiveGood: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#524B7D',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.strong,
  },
  chipDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#DCD6FD',
    marginHorizontal: 2,
  },
  subjectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeBadgeTheory: {
    backgroundColor: '#EEF2FF',
  },
  typeBadgeLab: {
    backgroundColor: '#FEF3C7',
  },
  typeBadgeTextTheory: {
    color: '#4F46E5',
    fontSize: 10,
    fontFamily: fonts.strong,
  },
  typeBadgeTextLab: {
    color: '#D97706',
    fontSize: 10,
    fontFamily: fonts.strong,
  },
});
