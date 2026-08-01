import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  SafeAreaView,
  StatusBar as RNStatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAttendance } from '../context/AttendanceContext';
import { lectureRecordRepository, getDb } from '../db';
import type { LectureRecord, LectureStatus } from '../types';
import { Screen } from '../components/Screen';
import { fonts, layout } from '../theme';
import { useAnalytics } from '../analytics/track';

type OverallStats = {
  present: number;
  absent: number;
  cancelled: number;
};

export function MarkAttendanceScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const { refresh, refreshKey } = useAttendance();
  const { track } = useAnalytics();

  const [records, setRecords] = useState<LectureRecord[]>([]);
  const [stats, setStats] = useState<OverallStats>({ present: 0, absent: 0, cancelled: 0 });
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedLectureForMenu, setSelectedLectureForMenu] = useState<LectureRecord | null>(null);

  const loadData = useCallback(async () => {
    const unmarked = await lectureRecordRepository.getUnmarked();
    setRecords(unmarked);

    const db = await getDb();
    const counts = await db.getFirstAsync<{ present: number; absent: number; cancelled: number }>(
      `SELECT 
        COALESCE(SUM(CASE WHEN l.status='present' THEN 1 ELSE 0 END), 0) AS present,
        COALESCE(SUM(CASE WHEN l.status='absent' THEN 1 ELSE 0 END), 0) AS absent,
        COALESCE(SUM(CASE WHEN l.status='cancelled' THEN 1 ELSE 0 END), 0) AS cancelled
       FROM lecture_records l
       JOIN subjects s ON s.id = l.subject_id
       WHERE s.is_deleted = 0`
    );

    if (counts) {
      setStats({
        present: counts.present,
        absent: counts.absent,
        cancelled: counts.cancelled,
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, refreshKey])
  );

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const mark = async (id: string, status: LectureStatus) => {
    await lectureRecordRepository.updateStatus(id, status);
    track('attendance_marked', { status });
    await refresh();
    await loadData();
  };

  const markAllLecturesPresent = async (date: string) => {
    const markedCount = await lectureRecordRepository.markDatePresent(date);
    track('attendance_bulk_marked', { count: markedCount });
    await refresh();
    await loadData();
  };

  const filteredRecords = selectedDateFilter
    ? records.filter((r) => r.date === selectedDateFilter)
    : records;

  const renderListHeader = () => (
    <View style={styles.headerWrapper}>
      <View style={styles.statsCard}>
        <View style={styles.statColumn}>
          <Text style={[styles.statCount, { color: '#16A34A' }]}>{stats.present}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statColumn}>
          <Text style={[styles.statCount, { color: '#DC2626' }]}>{stats.absent}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statColumn}>
          <Text style={[styles.statCount, { color: '#6366F1' }]}>{stats.cancelled}</Text>
          <Text style={styles.statLabel}>Holiday</Text>
        </View>
      </View>

      {selectedDateFilter && (
        <View style={styles.activeFilterRow}>
          <Text style={styles.activeFilterText}>
            Showing for {format(parseISO(selectedDateFilter), 'EEEE, dd MMM yyyy')}
          </Text>
          <Pressable onPress={() => setSelectedDateFilter(null)} style={styles.clearFilterBtn}>
            <Text style={styles.clearFilterText}>Show All</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderListFooter = () => (
    <View style={styles.instructionBanner}>
      <View style={styles.instructionIconBox}>
        <Ionicons name="calendar-outline" size={24} color="#6366F1" />
      </View>
      <View style={styles.instructionTextWrapper}>
        <Text style={styles.instructionTitle}>Tap on Present, Absent or Holiday</Text>
        <Text style={styles.instructionSub}>Mark your attendance for each lecture</Text>
      </View>
    </View>
  );

  return (
    <Screen>
      <View style={styles.screenWrapper}>
        <View style={styles.customHeader}>
          <Pressable
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Today')}
            style={styles.headerIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color="#0F172A" />
          </Pressable>

          <Text style={styles.screenTitle}>Mark Attendance</Text>

          <Pressable
            onPress={() => setDatePickerVisible(true)}
            style={styles.headerIconBtn}
            accessibilityRole="button"
            accessibilityLabel="Filter by date"
          >
            <Ionicons name="calendar-outline" size={22} color="#6366F1" />
          </Pressable>
        </View>

        {datePickerVisible && (
          <DateTimePicker
            value={selectedDateFilter ? parseISO(selectedDateFilter) : new Date()}
            mode="date"
            onValueChange={(_, date) => {
              setDatePickerVisible(false);
              setSelectedDateFilter(format(date, 'yyyy-MM-dd'));
            }}
            onDismiss={() => setDatePickerVisible(false)}
            onError={() => setDatePickerVisible(false)}
          />
        )}

        <FlatList
          style={[styles.listView, width >= layout.maxContentWidth && styles.wideList]}
          data={filteredRecords}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={filteredRecords.length > 0 ? renderListFooter : null}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="checkmark-done-circle" size={48} color="#22C55E" />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up! 🎉</Text>
              <Text style={styles.emptySub}>
                {selectedDateFilter
                  ? `No lectures waiting to be marked on ${format(parseISO(selectedDateFilter), 'dd MMM yyyy')}.`
                  : 'There are no pending lectures waiting to be marked.'}
              </Text>
              {selectedDateFilter && (
                <Pressable style={styles.resetFilterBtn} onPress={() => setSelectedDateFilter(null)}>
                  <Text style={styles.resetFilterText}>View All Lectures</Text>
                </Pressable>
              )}
            </View>
          }
          renderItem={({ item, index }) => {
            const showDateHeader =
              index === 0 || filteredRecords[index - 1].date !== item.date;

            const dateObj = parseISO(item.date);
            const dayOfWeek = format(dateObj, 'EEE').toUpperCase();
            const dayNum = format(dateObj, 'dd');
            const month = format(dateObj, 'MMM').toUpperCase();
            const fullDateHeader = format(dateObj, 'EEEE, dd MMM');

            return (
              <View style={styles.cardContainer}>
                {showDateHeader && (
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupDateText}>{fullDateHeader}</Text>
                    <Pressable
                      onPress={() => markAllLecturesPresent(item.date)}
                      style={styles.markAllBtn}
                      accessibilityRole="button"
                    >
                      <Ionicons name="checkmark-done" size={15} color="#4F46E5" style={{ marginRight: 4 }} />
                      <Text style={styles.markAllText}>Mark all present</Text>
                    </Pressable>
                  </View>
                )}

                <View style={styles.lectureCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateBoxDay}>{dayOfWeek}</Text>
                      <Text style={styles.dateBoxNum}>{dayNum}</Text>
                      <Text style={styles.dateBoxMonth}>{month}</Text>
                    </View>

                    <View style={styles.subjectWrapper}>
                      <Text style={styles.subjectName} numberOfLines={1}>
                        {item.subject_name}
                      </Text>
                      <Text style={styles.lectureSubtext}>Lecture</Text>
                    </View>

                    <Pressable
                      onPress={() => setSelectedLectureForMenu(item)}
                      style={styles.moreMenuBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="ellipsis-horizontal" size={18} color="#94A3B8" />
                    </Pressable>
                  </View>

                  <View style={styles.actionsRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.presentBtn,
                        item.status === 'present' && styles.presentActive,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => mark(item.id, 'present')}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={item.status === 'present' ? '#FFFFFF' : '#16A34A'}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          styles.presentText,
                          item.status === 'present' && styles.textActive,
                        ]}
                      >
                        Present
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.absentBtn,
                        item.status === 'absent' && styles.absentActive,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => mark(item.id, 'absent')}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={item.status === 'absent' ? '#FFFFFF' : '#EF4444'}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          styles.absentText,
                          item.status === 'absent' && styles.textActive,
                        ]}
                      >
                        Absent
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.holidayBtn,
                        item.status === 'cancelled' && styles.holidayActive,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={() => mark(item.id, 'cancelled')}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={item.status === 'cancelled' ? '#FFFFFF' : '#6366F1'}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          styles.holidayText,
                          item.status === 'cancelled' && styles.textActive,
                        ]}
                      >
                        Holiday
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }}
        />

        <Modal
          visible={!!selectedLectureForMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedLectureForMenu(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedLectureForMenu(null)}>
            <Pressable style={styles.modalContent} onPress={() => {}}>
              <Text style={styles.modalTitle}>Lecture Options</Text>
              {selectedLectureForMenu && (
                <Text style={styles.modalSub}>
                  {selectedLectureForMenu.subject_name} •{' '}
                  {format(parseISO(selectedLectureForMenu.date), 'dd MMM yyyy')}
                </Text>
              )}

              <View style={styles.optionsList}>
                <Pressable
                  style={[styles.menuOptionRow, { backgroundColor: '#ECFDF5' }]}
                  onPress={async () => {
                    if (selectedLectureForMenu) {
                      await mark(selectedLectureForMenu.id, 'present');
                      setSelectedLectureForMenu(null);
                    }
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#16A34A" style={{ marginRight: 12 }} />
                  <Text style={[styles.menuOptionText, { color: '#16A34A' }]}>Mark Present</Text>
                </Pressable>

                <Pressable
                  style={[styles.menuOptionRow, { backgroundColor: '#FEF2F2' }]}
                  onPress={async () => {
                    if (selectedLectureForMenu) {
                      await mark(selectedLectureForMenu.id, 'absent');
                      setSelectedLectureForMenu(null);
                    }
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#EF4444" style={{ marginRight: 12 }} />
                  <Text style={[styles.menuOptionText, { color: '#EF4444' }]}>Mark Absent</Text>
                </Pressable>

                <Pressable
                  style={[styles.menuOptionRow, { backgroundColor: '#EEF2FF' }]}
                  onPress={async () => {
                    if (selectedLectureForMenu) {
                      await mark(selectedLectureForMenu.id, 'cancelled');
                      setSelectedLectureForMenu(null);
                    }
                  }}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6366F1" style={{ marginRight: 12 }} />
                  <Text style={[styles.menuOptionText, { color: '#6366F1' }]}>Mark Holiday / Cancelled</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.closeModalBtn}
                onPress={() => setSelectedLectureForMenu(null)}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: RNStatusBar.currentHeight ? RNStatusBar.currentHeight + 8 : 12,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  screenTitle: {
    fontFamily: fonts.strong,
    fontSize: 20,
    color: '#0F172A',
  },
  listView: {
    width: '100%',
    alignSelf: 'center',
  },
  wideList: {
    maxWidth: layout.maxContentWidth,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerWrapper: {
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 8,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statCount: {
    fontFamily: fonts.strong,
    fontSize: 22,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F1F5F9',
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 8,
  },
  activeFilterText: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: '#4F46E5',
  },
  clearFilterBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  clearFilterText: {
    fontFamily: fonts.strong,
    fontSize: 12,
    color: '#6366F1',
  },
  cardContainer: {
    marginBottom: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupDateText: {
    fontFamily: fonts.strong,
    fontSize: 15,
    color: '#0F172A',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllText: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: '#4F46E5',
  },
  lectureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dateBox: {
    width: 52,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBoxDay: {
    fontFamily: fonts.display,
    fontSize: 10,
    color: '#94A3B8',
  },
  dateBoxNum: {
    fontFamily: fonts.strong,
    fontSize: 18,
    color: '#0F172A',
    lineHeight: 22,
  },
  dateBoxMonth: {
    fontFamily: fonts.display,
    fontSize: 10,
    color: '#94A3B8',
  },
  subjectWrapper: {
    flex: 1,
    marginLeft: 14,
  },
  subjectName: {
    fontFamily: fonts.strong,
    fontSize: 17,
    color: '#0F172A',
  },
  lectureSubtext: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  moreMenuBtn: {
    padding: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  presentBtn: {
    backgroundColor: '#ECFDF5',
  },
  absentBtn: {
    backgroundColor: '#FEF2F2',
  },
  holidayBtn: {
    backgroundColor: '#F1F5F9',
  },
  presentActive: {
    backgroundColor: '#16A34A',
  },
  absentActive: {
    backgroundColor: '#DC2626',
  },
  holidayActive: {
    backgroundColor: '#6366F1',
  },
  actionBtnText: {
    fontFamily: fonts.display,
    fontSize: 14,
  },
  presentText: {
    color: '#16A34A',
  },
  absentText: {
    color: '#DC2626',
  },
  holidayText: {
    color: '#6366F1',
  },
  textActive: {
    color: '#FFFFFF',
  },
  instructionBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  instructionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  instructionTextWrapper: {
    flex: 1,
  },
  instructionTitle: {
    fontFamily: fonts.strong,
    fontSize: 14,
    color: '#0F172A',
  },
  instructionSub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.strong,
    fontSize: 22,
    color: '#0F172A',
  },
  emptySub: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetFilterBtn: {
    marginTop: 16,
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  resetFilterText: {
    fontFamily: fonts.strong,
    fontSize: 14,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontFamily: fonts.strong,
    fontSize: 18,
    color: '#0F172A',
    textAlign: 'center',
  },
  modalSub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  optionsList: {
    gap: 10,
  },
  menuOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
  menuOptionText: {
    fontFamily: fonts.strong,
    fontSize: 15,
  },
  closeModalBtn: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    alignItems: 'center',
  },
  closeModalText: {
    fontFamily: fonts.strong,
    fontSize: 15,
    color: '#64748B',
  },
});
