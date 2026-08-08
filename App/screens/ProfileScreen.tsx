import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAttendance } from '../context/AttendanceContext';
import { exportAllDataToJson, getDb, resetDatabase, runMigrations, subjectRepository } from '../db';
import type { SubjectSummary } from '../types';
import { Screen } from '../components/Screen';
import { ConfirmModal } from '../components/ConfirmModal';
import { fonts, layout } from '../theme';

export function ProfileScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const { userName, autoMarkPresent, setUserName, setAutoMarkPresent, refresh, refreshKey } = useAttendance();

  const [inputName, setInputName] = useState(userName);
  const [subjects, setSubjects] = useState<SubjectSummary[]>([]);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);

  useEffect(() => {
    setInputName(userName);
  }, [userName]);

  useFocusEffect(
    React.useCallback(() => {
      subjectRepository.getSummaries().then(setSubjects);
    }, [refreshKey])
  );

  useEffect(() => {
    subjectRepository.getSummaries().then(setSubjects);
  }, [refreshKey]);

  const [infoModal, setInfoModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBg?: string;
    confirmText?: string;
    confirmTone?: 'danger' | 'primary' | 'success';
    filePath?: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlertModal = (opts: {
    title: string;
    message: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBg?: string;
    confirmText?: string;
    confirmTone?: 'danger' | 'primary' | 'success';
    filePath?: string;
  }) => {
    setInfoModal({
      visible: true,
      title: opts.title,
      message: opts.message,
      icon: opts.icon ?? 'checkmark-circle-outline',
      iconColor: opts.iconColor ?? '#6366F1',
      iconBg: opts.iconBg ?? '#EEF2FF',
      confirmText: opts.confirmText ?? 'Got It',
      confirmTone: opts.confirmTone ?? 'primary',
      filePath: opts.filePath,
    });
  };

  const closeInfoModal = () => {
    setInfoModal((prev) => ({ ...prev, visible: false }));
  };

  const handleSaveName = async () => {
    if (!inputName.trim()) {
      showAlertModal({
        title: 'Name Required',
        message: 'Please enter a valid name before saving your profile.',
        icon: 'alert-circle-outline',
        iconColor: '#EF4444',
        iconBg: '#FEF2F2',
        confirmTone: 'danger',
        confirmText: 'OK',
      });
      return;
    }
    await setUserName(inputName.trim());
    showAlertModal({
      title: 'Profile Updated! ✨',
      message: 'Your profile name has been updated successfully.',
      icon: 'checkmark-circle-outline',
      iconColor: '#22C55E',
      iconBg: '#DCFCE7',
      confirmTone: 'success',
      confirmText: 'Awesome!',
    });
  };

  const handleToggleAutoMark = async (value: boolean) => {
    await setAutoMarkPresent(value);
    if (value) {
      showAlertModal({
        title: 'Auto-Mark Enabled 🎉',
        message:
          'Past & today’s unmarked lectures are now marked as Present by default. You only need to manually mark when you are Absent!',
        icon: 'sparkles-outline',
        iconColor: '#6366F1',
        iconBg: '#EEF2FF',
        confirmTone: 'primary',
        confirmText: 'Got It!',
      });
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const filePath = await exportAllDataToJson();
      showAlertModal({
        title: 'Export Successful 📤',
        message: 'All your attendance records, subjects, schedules, and settings have been exported.',
        icon: 'cloud-download-outline',
        iconColor: '#22C55E',
        iconBg: '#DCFCE7',
        confirmTone: 'success',
        confirmText: 'Done',
        filePath,
      });
    } catch (e: any) {
      showAlertModal({
        title: 'Export Failed',
        message: e.message ?? 'Failed to export data. Please try again.',
        icon: 'alert-circle-outline',
        iconColor: '#EF4444',
        iconBg: '#FEF2F2',
        confirmTone: 'danger',
        confirmText: 'OK',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url);
  };

  const clearData = async () => {
    setClearModalVisible(false);
    setClearing(true);
    try {
      await resetDatabase();
      await runMigrations(await getDb());
      await refresh();
      setSubjects([]);
      setInputName('Sumit');
      showAlertModal({
        title: 'Data Cleared',
        message: 'All subjects, schedules, attendance records, and settings have been removed from this device.',
        icon: 'trash-outline',
        iconColor: '#6366F1',
        iconBg: '#EEF2FF',
        confirmTone: 'primary',
        confirmText: 'OK',
      });
    } catch (e: any) {
      showAlertModal({
        title: 'Could Not Clear Data',
        message: e.message ?? 'Please try again.',
        icon: 'alert-circle-outline',
        iconColor: '#EF4444',
        iconBg: '#FEF2F2',
        confirmTone: 'danger',
        confirmText: 'OK',
      });
    } finally {
      setClearing(false);
    }
  };

  const handleClearData = () => {
    setClearModalVisible(true);
  };

  const totalPresent = subjects.reduce((sum, s) => sum + s.present, 0);
  const totalLectures = subjects.reduce((sum, s) => sum + s.total, 0);
  const overallPercent = totalLectures > 0 ? Math.round((totalPresent / totalLectures) * 100) : null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, width >= layout.maxContentWidth && styles.wideContainer]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile & Settings</Text>
            <Text style={styles.headerSub}>Manage your account & tracking preferences</Text>
          </View>

          <View style={styles.profileCard}>
            <Image source={require('../assets/icon.png')} style={styles.avatar} />
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileRole}>Student • RollCall</Text>
              <View style={styles.studentPill}>
                <Ionicons name="school-outline" size={13} color="#6366F1" style={{ marginRight: 4 }} />
                <Text style={styles.studentPillText}>{subjects.length} Active Subjects</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={22} color="#6366F1" style={{ marginRight: 10 }} />
              <Text style={styles.sectionTitle}>Account Details</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Name</Text>
              <View style={styles.nameRow}>
                <TextInput
                  value={inputName}
                  onChangeText={setInputName}
                  style={styles.nameInput}
                  placeholder="Enter your name"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                />
                <Pressable
                  style={styles.saveNameBtn}
                  onPress={handleSaveName}
                  accessibilityRole="button"
                >
                  <Text style={styles.saveNameText}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="options-outline" size={22} color="#6366F1" style={{ marginRight: 10 }} />
              <Text style={styles.sectionTitle}>Attendance Preferences</Text>
            </View>

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceIconBox}>
                <Ionicons
                  name={autoMarkPresent ? 'checkmark-done-circle' : 'checkmark-circle-outline'}
                  size={26}
                  color={autoMarkPresent ? '#22C55E' : '#94A3B8'}
                />
              </View>

              <View style={styles.preferenceTextWrapper}>
                <View style={styles.preferenceTitleRow}>
                  <Text style={styles.preferenceTitle}>Auto-Mark Present</Text>
                  <View style={[styles.statusBadge, autoMarkPresent ? styles.badgeActive : styles.badgeDisabled]}>
                    <Text style={[styles.statusBadgeText, autoMarkPresent ? styles.badgeTextActive : styles.badgeTextDisabled]}>
                      {autoMarkPresent ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.preferenceSubtext}>
                  Automatically mark past & today's lectures as Present. You only need to mark manually when you are Absent.
                </Text>
              </View>

              <Switch
                value={autoMarkPresent}
                onValueChange={handleToggleAutoMark}
                trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                thumbColor={autoMarkPresent ? '#4F46E5' : '#F1F5F9'}
              />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="stats-chart-outline" size={22} color="#6366F1" style={{ marginRight: 10 }} />
              <Text style={styles.sectionTitle}>Attendance Summary</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{subjects.length}</Text>
                <Text style={styles.statLabel}>Subjects</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{totalPresent}/{totalLectures}</Text>
                <Text style={styles.statLabel}>Present / Total</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={[styles.statNumber, { color: '#6366F1' }]}>
                  {overallPercent === null ? '—' : `${overallPercent}%`}
                </Text>
                <Text style={styles.statLabel}>Overall Average</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="download-outline" size={22} color="#6366F1" style={{ marginRight: 10 }} />
              <Text style={styles.sectionTitle}>Data Management</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.8 }, exporting && { opacity: 0.6 }]}
              onPress={handleExportData}
              disabled={exporting}
              accessibilityRole="button"
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.exportBtnText}>{exporting ? 'Exporting...' : 'Export My Data (JSON)'}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.clearDataBtn, pressed && { opacity: 0.8 }, clearing && { opacity: 0.6 }]}
              onPress={handleClearData}
              disabled={clearing}
              accessibilityRole="button"
              accessibilityLabel="Clear all app data"
            >
              <Ionicons name="trash-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.clearDataText}>{clearing ? 'Clearing...' : 'Clear All App Data'}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerTitle}>RollCall App</Text>
            <Text style={styles.footerSub}>Version 1.0.0 • SQLite Offline Enabled</Text>

            <View style={styles.linksContainer}>
              <Pressable
                style={styles.linkBadge}
                onPress={() => handleOpenUrl('https://github.com/sumitc0de')}
                accessibilityRole="link"
                accessibilityLabel="GitHub Profile"
              >
                <Ionicons name="logo-github" size={15} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.linkText}>
                  Built by <Text style={styles.linkHighlight}>sumitc0de</Text>
                </Text>
                <Ionicons name="open-outline" size={12} color="#6366F1" style={{ marginLeft: 4 }} />
              </Pressable>

              <Pressable
                style={styles.linkBadge}
                onPress={() => handleOpenUrl('https://sumitxdev.online')}
                accessibilityRole="link"
                accessibilityLabel="Developer Portfolio"
              >
                <Ionicons name="globe-outline" size={15} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.linkText}>
                  Portfolio: <Text style={styles.linkHighlight}>sumitxdev.online</Text>
                </Text>
                <Ionicons name="open-outline" size={12} color="#6366F1" style={{ marginLeft: 4 }} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={clearModalVisible}
        title="Clear All App Data?"
        message="This permanently removes all subjects, schedules, attendance records, and settings from this device."
        icon="trash"
        iconColor="#EF4444"
        iconBg="#FEF2F2"
        confirmText="Clear Data"
        cancelText="Cancel"
        confirmTone="danger"
        onConfirm={() => void clearData()}
        onCancel={() => setClearModalVisible(false)}
      />

      <ConfirmModal
        visible={infoModal.visible}
        title={infoModal.title}
        message={infoModal.message}
        icon={infoModal.icon}
        iconColor={infoModal.iconColor}
        iconBg={infoModal.iconBg}
        confirmText={infoModal.confirmText}
        confirmTone={infoModal.confirmTone}
        onConfirm={closeInfoModal}
        extraContent={
          infoModal.filePath ? (
            <View style={styles.filePathBox}>
              <View style={styles.filePathHeader}>
                <Ionicons name="document-text-outline" size={16} color="#6366F1" />
                <Text style={styles.filePathTitle}>Backup Destination</Text>
              </View>
              <Text style={styles.filePathText} numberOfLines={3}>
                {infoModal.filePath}
              </Text>
            </View>
          ) : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 110,
  },
  container: {
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  wideContainer: {
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: fonts.strong,
    fontSize: 26,
    color: '#0F172A',
  },
  headerSub: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontFamily: fonts.strong,
    fontSize: 22,
    color: '#0F172A',
  },
  profileRole: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  studentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  studentPillText: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: '#4F46E5',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#475569',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.strong,
    fontSize: 17,
    color: '#0F172A',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: fonts.display,
    fontSize: 13,
    color: '#475569',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontFamily: fonts.display,
    fontSize: 15,
    color: '#0F172A',
  },
  saveNameBtn: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveNameText: {
    fontFamily: fonts.strong,
    fontSize: 14,
    color: '#FFFFFF',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  preferenceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  preferenceTextWrapper: {
    flex: 1,
    marginRight: 12,
  },
  preferenceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preferenceTitle: {
    fontFamily: fonts.strong,
    fontSize: 16,
    color: '#0F172A',
  },
  preferenceSubtext: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: '#DCFCE7',
  },
  badgeDisabled: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontFamily: fonts.strong,
    fontSize: 11,
  },
  badgeTextActive: {
    color: '#166534',
  },
  badgeTextDisabled: {
    color: '#64748B',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fonts.strong,
    fontSize: 18,
    color: '#0F172A',
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  exportBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtnText: {
    fontFamily: fonts.strong,
    fontSize: 15,
    color: '#FFFFFF',
  },
  clearDataBtn: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  clearDataText: {
    fontFamily: fonts.strong,
    fontSize: 15,
    color: '#DC2626',
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
  },
  footerTitle: {
    fontFamily: fonts.display,
    fontSize: 14,
    color: '#64748B',
  },
  footerSub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  linksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
  },
  linkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  linkText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#475569',
  },
  linkHighlight: {
    fontFamily: fonts.strong,
    color: '#6366F1',
  },
  filePathBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  filePathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  filePathTitle: {
    fontFamily: fonts.strong,
    fontSize: 12,
    color: '#4338CA',
  },
  filePathText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#3730A3',
    lineHeight: 16,
  },
});
