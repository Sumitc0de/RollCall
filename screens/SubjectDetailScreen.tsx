import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAttendance } from '../context/AttendanceContext';
import { subjectRepository, lectureRecordRepository } from '../db';
import type { Attendance, LectureRecord, LectureStatus, Subject } from '../types';
import { classesNeededToRecover, safeSkips } from '../utils/attendanceMath';
import { Screen } from '../components/Screen';
import { ConfirmModal } from '../components/ConfirmModal';
import { fonts, layout } from '../theme';
import { useAnalytics } from '../analytics/track';

type FilterType = 'all' | 'present' | 'absent' | 'cancelled' | 'unmarked';

export function SubjectDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const id = route.params.subjectId;
  const { refresh, refreshKey } = useAttendance();
  const { track } = useAnalytics();

  const [subject, setSubject] = useState<Subject>();
  const [attendance, setAttendance] = useState<Attendance>({ present: 0, total: 0, percent: null });
  const [history, setHistory] = useState<LectureRecord[]>([]);

  const [filter, setFilter] = useState<FilterType>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LectureRecord | null>(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const load = useCallback(async () => {
    const [s, a, h] = await Promise.all([
      subjectRepository.getById(id),
      lectureRecordRepository.getAttendance(id),
      lectureRecordRepository.getHistory(id),
    ]);
    setSubject(s ?? undefined);
    setAttendance(a);
    setHistory(h);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, refreshKey])
  );

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    track('subject_detail_viewed');
  }, [track]);

  const removeSubject = useCallback(() => {
    if (!subject) return;
    setSettingsModalVisible(false);
    setDeleteModalVisible(true);
  }, [subject]);

  const confirmDeleteSubject = async () => {
    setDeleteModalVisible(false);
    await subjectRepository.softDelete(id);
    track('subject_deleted');
    await refresh();
    navigation.goBack();
  };

  const handleUpdateRecordStatus = async (status: LectureStatus) => {
    if (!selectedRecord) return;
    await lectureRecordRepository.updateStatus(selectedRecord.id, status);
    track('attendance_marked', { status });
    setSelectedRecord(null);
    await refresh();
    await load();
  };

  const above = attendance.percent !== null && subject ? attendance.percent >= subject.target_percent : false;
  const absentCount = history.filter((r) => r.status === 'absent').length;

  const filteredHistory = useMemo(() => {
    return history.filter((r) => {
      if (filter === 'all') return true;
      return r.status === filter;
    });
  }, [filter, history]);

  const skipsCount = attendance.percent !== null && subject ? safeSkips(attendance.present, attendance.total, subject.target_percent) : 0;
  const recoverCount = attendance.percent !== null && subject ? classesNeededToRecover(attendance.present, attendance.total, subject.target_percent) : 0;

  const adviceText = useMemo(() => {
    if (!subject) return '';
    if (attendance.percent === null) return 'Mark your first lecture to start tracking insights.';
    if (above) return `Safe to skip ${skipsCount} more class(es) and still maintain ${subject.target_percent}%.`;
    return `Attend the next ${recoverCount} class(es) to recover target ${subject.target_percent}%.`;
  }, [above, attendance.percent, recoverCount, skipsCount, subject]);

  const renderListHeader = useCallback(() => {
    if (!subject) return null;
    return (
      <View style={styles.headerContainer}>
        <View style={styles.heroCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="book-outline" size={24} color="#6366F1" />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.subjectName} numberOfLines={1}>
                {subject.name}
              </Text>
              <Text style={styles.heldLectures}>{attendance.total} Held Lectures</Text>
            </View>
            <View style={styles.targetBadge}>
              <Text style={styles.targetText}>TARGET {subject.target_percent}%</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <DonutGauge percent={attendance.percent} above={above} />

            <View style={styles.legendContainer}>
              <View style={styles.legendRow}>
                <View style={[styles.bulletDot, { backgroundColor: '#22C55E' }]} />
                <Text style={[styles.legendValue, { color: '#16A34A' }]}>{attendance.present}</Text>
                <Text style={styles.legendLabel}>Present</Text>
              </View>

              <View style={styles.legendRow}>
                <View style={[styles.bulletDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.legendValue, { color: '#DC2626' }]}>{absentCount}</Text>
                <Text style={styles.legendLabel}>Absent</Text>
              </View>

              <View style={styles.legendRow}>
                <View style={[styles.bulletDot, { backgroundColor: '#94A3B8' }]} />
                <Text style={[styles.legendValue, { color: '#334155' }]}>{attendance.total}</Text>
                <Text style={styles.legendLabel}>Total Lectures</Text>
              </View>
            </View>
          </View>

          <View style={[styles.adviceBox, above ? styles.adviceSuccess : styles.adviceWarning]}>
            <Ionicons
              name={above ? 'checkmark-circle' : 'alert-circle'}
              size={22}
              color={above ? '#22C55E' : '#EF4444'}
              style={styles.adviceIcon}
            />
            <View style={styles.adviceTextWrapper}>
              <Text style={[styles.adviceTitle, above ? styles.adviceTitleSuccess : styles.adviceTitleWarning]}>
                {above ? "Great! You're above the target 🎉" : 'Attention! Below Target ⚠️'}
              </Text>
              <Text style={[styles.adviceSubtext, above ? styles.adviceSubtextSuccess : styles.adviceSubtextWarning]}>
                {adviceText}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.toolsRow}>
          <Pressable
            style={styles.editBtn}
            onPress={() => navigation.navigate('Add', { subjectId: id })}
            accessibilityRole="button"
            accessibilityLabel="Edit subject"
          >
            <Ionicons name="pencil" size={18} color="#6366F1" style={{ marginRight: 8 }} />
            <Text style={styles.editBtnText}>Edit Subject</Text>
          </Pressable>

          <Pressable
            style={styles.deleteBtn}
            onPress={removeSubject}
            accessibilityRole="button"
            accessibilityLabel="Delete subject"
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.deleteBtnText}>Delete Subject</Text>
          </Pressable>
        </View>

        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionTitle}>Lecture History</Text>

          <Pressable
            style={styles.filterPill}
            onPress={() => setFilterModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Filter history"
          >
            <Ionicons name="filter-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.filterPillText}>
              {filter === 'all'
                ? 'All Lectures'
                : filter === 'present'
                  ? 'Present'
                  : filter === 'absent'
                    ? 'Absent'
                    : filter === 'cancelled'
                      ? 'Cancelled'
                      : 'Unmarked'}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#64748B" style={{ marginLeft: 4 }} />
          </Pressable>
        </View>
      </View>
    );
  }, [above, absentCount, adviceText, attendance.percent, attendance.present, attendance.total, filter, id, navigation, removeSubject, subject]);

  const renderItem = useCallback(({ item }: { item: LectureRecord }) => {
    const lectureNum = history.length - history.findIndex((h) => h.id === item.id);
    const dateObj = parseISO(item.date);
    const dayOfWeek = format(dateObj, 'EEE').toUpperCase();
    const dayNum = format(dateObj, 'dd');
    const month = format(dateObj, 'MMM').toUpperCase();
    const fullDate = format(dateObj, 'EEE, dd MMM yyyy');

    return (
      <Pressable
        onPress={() => setSelectedRecord(item)}
        style={({ pressed }) => [styles.recordCard, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.status} lecture on ${fullDate}`}
      >
        <View style={styles.dateBox}>
          <Text style={styles.dateBoxDay}>{dayOfWeek}</Text>
          <Text style={styles.dateBoxNum}>{dayNum}</Text>
          <Text style={styles.dateBoxMonth}>{month}</Text>
        </View>

        <View style={styles.recordMainInfo}>
          <Text style={styles.recordFullDate}>{fullDate}</Text>
          <View style={styles.lectureRow}>
            <Ionicons name="time-outline" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
            <Text style={styles.lectureNumText}>Lecture {lectureNum}</Text>
          </View>
        </View>

        <View style={styles.rightStatusWrapper}>
          <View
            style={[
              styles.statusPill,
              item.status === 'present'
                ? styles.pillPresent
                : item.status === 'absent'
                  ? styles.pillAbsent
                  : item.status === 'cancelled'
                    ? styles.pillCancelled
                    : styles.pillUnmarked,
            ]}
          >
            <Ionicons
              name={
                item.status === 'present'
                  ? 'checkmark-circle'
                  : item.status === 'absent'
                    ? 'close-circle'
                    : item.status === 'cancelled'
                      ? 'remove-circle'
                      : 'help-circle'
              }
              size={14}
              color={
                item.status === 'present'
                  ? '#16A34A'
                  : item.status === 'absent'
                    ? '#EF4444'
                    : item.status === 'cancelled'
                      ? '#64748B'
                      : '#D97706'
              }
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.statusPillText,
                item.status === 'present'
                  ? styles.statusTextPresent
                  : item.status === 'absent'
                    ? styles.statusTextAbsent
                    : item.status === 'cancelled'
                      ? styles.statusTextCancelled
                      : styles.statusTextUnmarked,
              ]}
            >
              {item.status === 'present'
                ? 'Present'
                : item.status === 'absent'
                  ? 'Absent'
                  : item.status === 'cancelled'
                    ? 'Holiday'
                    : 'Unmarked'}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" style={{ marginLeft: 6 }} />
        </View>
      </Pressable>
    );
  }, [history]);

  if (!subject) return null;

  return (
    <Screen edges={['left', 'right']}>
      <View style={styles.screenWrapper}>
        <View style={[styles.customHeader, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </Pressable>

          <Text style={styles.screenTitle}>Subject Details</Text>

          <Pressable
            onPress={() => setSettingsModalVisible(true)}
            style={styles.settingsBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Subject options"
          >
            <Ionicons name="settings-sharp" size={20} color="#475569" />
          </Pressable>
        </View>

        <FlatList
          style={[styles.listView, width >= layout.maxContentWidth && styles.wideList]}
          data={filteredHistory}
          keyExtractor={(r) => r.id}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyText}>
                {filter === 'all'
                  ? 'No lectures recorded for this subject yet.'
                  : `No ${filter} lectures found.`}
              </Text>
            </View>
          }
          renderItem={renderItem}
        />

        <Modal
          visible={!!selectedRecord}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedRecord(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedRecord(null)}>
            <Pressable style={styles.modalContent} onPress={() => { }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Lecture Status</Text>
                {selectedRecord && (
                  <Text style={styles.modalSub}>
                    {format(parseISO(selectedRecord.date), 'EEE, dd MMM yyyy')}
                  </Text>
                )}
              </View>

              <View style={styles.optionsList}>
                <OptionItem
                  icon="checkmark-circle"
                  color="#16A34A"
                  bg="#ECFDF5"
                  label="Present"
                  selected={selectedRecord?.status === 'present'}
                  onPress={() => handleUpdateRecordStatus('present')}
                />
                <OptionItem
                  icon="close-circle"
                  color="#EF4444"
                  bg="#FEF2F2"
                  label="Absent"
                  selected={selectedRecord?.status === 'absent'}
                  onPress={() => handleUpdateRecordStatus('absent')}
                />
                <OptionItem
                  icon="remove-circle"
                  color="#64748B"
                  bg="#F1F5F9"
                  label="Holiday / Cancelled"
                  selected={selectedRecord?.status === 'cancelled'}
                  onPress={() => handleUpdateRecordStatus('cancelled')}
                />
                <OptionItem
                  icon="help-circle"
                  color="#D97706"
                  bg="#FEF3C7"
                  label="Unmarked"
                  selected={selectedRecord?.status === 'unmarked'}
                  onPress={() => handleUpdateRecordStatus('unmarked')}
                />
              </View>

              <Pressable style={styles.closeModalBtn} onPress={() => setSelectedRecord(null)}>
                <Text style={styles.closeModalText}>Cancel</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={filterModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={() => { }}>
              <Text style={styles.modalTitle}>Filter History</Text>
              <Text style={styles.modalSub}>Show lectures by status</Text>

              <View style={styles.optionsList}>
                <FilterOption
                  label="All Lectures"
                  active={filter === 'all'}
                  onPress={() => {
                    setFilter('all');
                    setFilterModalVisible(false);
                  }}
                />
                <FilterOption
                  label="Present Only"
                  active={filter === 'present'}
                  onPress={() => {
                    setFilter('present');
                    setFilterModalVisible(false);
                  }}
                />
                <FilterOption
                  label="Absent Only"
                  active={filter === 'absent'}
                  onPress={() => {
                    setFilter('absent');
                    setFilterModalVisible(false);
                  }}
                />
                <FilterOption
                  label="Cancelled / Holiday"
                  active={filter === 'cancelled'}
                  onPress={() => {
                    setFilter('cancelled');
                    setFilterModalVisible(false);
                  }}
                />
                <FilterOption
                  label="Unmarked Only"
                  active={filter === 'unmarked'}
                  onPress={() => {
                    setFilter('unmarked');
                    setFilterModalVisible(false);
                  }}
                />
              </View>

              <Pressable style={styles.closeModalBtn} onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeModalText}>Close</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={settingsModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setSettingsModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSettingsModalVisible(false)}>
            <Pressable style={styles.modalContent} onPress={() => { }}>
              <Text style={styles.modalTitle}>Subject Options</Text>
              <Text style={styles.modalSub}>{subject.name}</Text>

              <View style={styles.optionsList}>
                <Pressable
                  style={styles.settingOptionRow}
                  onPress={() => {
                    setSettingsModalVisible(false);
                    navigation.navigate('Add', { subjectId: id });
                  }}
                >
                  <Ionicons name="pencil" size={20} color="#6366F1" style={{ marginRight: 12 }} />
                  <Text style={styles.settingOptionText}>Edit Subject & Schedule</Text>
                </Pressable>

                <Pressable style={styles.settingOptionRow} onPress={removeSubject}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 12 }} />
                  <Text style={[styles.settingOptionText, { color: '#EF4444' }]}>Delete Subject</Text>
                </Pressable>
              </View>

              <Pressable style={styles.closeModalBtn} onPress={() => setSettingsModalVisible(false)}>
                <Text style={styles.closeModalText}>Cancel</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>

      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Subject?"
        message={`This will remove ${subject?.name ?? 'this subject'} from your active subjects. This action can be reversed by restoring database if needed.`}
        icon="trash"
        iconColor="#EF4444"
        iconBg="#FEF2F2"
        confirmText="Delete Subject"
        cancelText="Cancel"
        confirmTone="danger"
        onConfirm={confirmDeleteSubject}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </Screen>
  );
}

function DonutGauge({ percent, above }: { percent: number | null; above: boolean }) {
  const displayPercent = percent === null ? 0 : Math.min(Math.max(percent, 0), 100);
  const strokeColor = above ? '#7C3AED' : '#EF4444';
  const rotation = `${(displayPercent / 100) * 360}deg`;

  return (
    <View style={donutStyles.container}>
      <View style={donutStyles.track} />
      <View
        style={[
          donutStyles.progressArc,
          {
            borderColor: strokeColor,
            borderTopColor: strokeColor,
            borderRightColor: displayPercent >= 25 ? strokeColor : 'transparent',
            borderBottomColor: displayPercent >= 50 ? strokeColor : 'transparent',
            borderLeftColor: displayPercent >= 75 ? strokeColor : 'transparent',
            transform: [{ rotate: rotation }],
          },
        ]}
      />
      <View style={donutStyles.labelContainer}>
        <Text style={styles.gaugePercent}>
          {percent === null ? '—' : `${percent.toFixed(1)}%`}
        </Text>
        <Text style={styles.gaugeLabel}>Current</Text>
      </View>
    </View>
  );
}

function OptionItem({ icon, color, bg, label, selected, onPress }: any) {
  return (
    <Pressable style={[styles.optionRow, { backgroundColor: bg }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} style={{ marginRight: 12 }} />
      <Text style={[styles.optionLabel, { color }]}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={20} color={color} style={{ marginLeft: 'auto' }} />}
    </Pressable>
  );
}

function FilterOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.filterRow, active && styles.filterRowActive]} onPress={onPress}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      {active && <Ionicons name="checkmark-circle" size={18} color="#6366F1" />}
    </Pressable>
  );
}

const donutStyles = StyleSheet.create({
  container: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 11,
    borderColor: '#EEF2FF',
  },
  progressArc: {
    position: 'absolute',
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 11,
    borderColor: 'transparent',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontFamily: fonts.strong,
    fontSize: 20,
    color: '#0F172A',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
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
  headerContainer: {
    marginBottom: 8,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0EEFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  subjectName: {
    fontFamily: fonts.strong,
    fontSize: 20,
    color: '#0F172A',
    lineHeight: 24,
  },
  heldLectures: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  targetBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  targetText: {
    fontFamily: fonts.strong,
    fontSize: 11,
    color: '#7C3AED',
    letterSpacing: 0.4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 4,
  },
  gaugePercent: {
    fontFamily: fonts.strong,
    fontSize: 24,
    color: '#0F172A',
  },
  gaugeLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#64748B',
    marginTop: -2,
  },
  legendContainer: {
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  legendValue: {
    fontFamily: fonts.strong,
    fontSize: 16,
    width: 26,
    marginRight: 6,
  },
  legendLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#64748B',
  },
  adviceBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  adviceSuccess: {
    backgroundColor: '#ECFDF5',
  },
  adviceWarning: {
    backgroundColor: '#FEF2F2',
  },
  adviceIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  adviceTextWrapper: {
    flex: 1,
  },
  adviceTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    marginBottom: 2,
  },
  adviceTitleSuccess: {
    color: '#15803D',
  },
  adviceTitleWarning: {
    color: '#991B1B',
  },
  adviceSubtext: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  adviceSubtextSuccess: {
    color: '#166534',
  },
  adviceSubtextWarning: {
    color: '#991B1B',
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  editBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontFamily: fonts.strong,
    fontSize: 14,
    color: '#6366F1',
  },
  deleteBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontFamily: fonts.strong,
    fontSize: 14,
    color: '#EF4444',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fonts.strong,
    fontSize: 18,
    color: '#0F172A',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  filterPillText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.8,
  },
  dateBox: {
    width: 48,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dateBoxDay: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: '#94A3B8',
  },
  dateBoxNum: {
    fontFamily: fonts.strong,
    fontSize: 16,
    color: '#0F172A',
    lineHeight: 20,
  },
  dateBoxMonth: {
    fontFamily: fonts.display,
    fontSize: 9,
    color: '#94A3B8',
  },
  recordMainInfo: {
    flex: 1,
  },
  recordFullDate: {
    fontFamily: fonts.strong,
    fontSize: 15,
    color: '#0F172A',
  },
  lectureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lectureNumText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#94A3B8',
  },
  rightStatusWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pillPresent: {
    backgroundColor: '#ECFDF5',
  },
  pillAbsent: {
    backgroundColor: '#FEF2F2',
  },
  pillCancelled: {
    backgroundColor: '#F1F5F9',
  },
  pillUnmarked: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontFamily: fonts.strong,
    fontSize: 12,
  },
  statusTextPresent: {
    color: '#16A34A',
  },
  statusTextAbsent: {
    color: '#EF4444',
  },
  statusTextCancelled: {
    color: '#64748B',
  },
  statusTextUnmarked: {
    color: '#D97706',
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
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: fonts.strong,
    fontSize: 18,
    color: '#0F172A',
  },
  modalSub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  optionsList: {
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
  },
  optionLabel: {
    fontFamily: fonts.strong,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
  },
  filterRowActive: {
    backgroundColor: '#EEF2FF',
  },
  filterText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#475569',
  },
  filterTextActive: {
    fontFamily: fonts.strong,
    color: '#6366F1',
  },
  settingOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
  },
  settingOptionText: {
    fontFamily: fonts.strong,
    fontSize: 15,
    color: '#0F172A',
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
