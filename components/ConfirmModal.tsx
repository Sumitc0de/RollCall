import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../theme';

export type ConfirmModalProps = {
    visible: boolean;
    title: string;
    message: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    iconBg?: string;
    confirmText?: string;
    cancelText?: string | null;
    confirmTone?: 'danger' | 'primary' | 'success';
    extraContent?: React.ReactNode;
    onConfirm: () => void;
    onCancel?: () => void;
};

export function ConfirmModal({
    visible,
    title,
    message,
    icon = 'alert-circle-outline',
    iconColor = '#EF4444',
    iconBg = '#FEF2F2',
    confirmText = 'Confirm',
    cancelText,
    confirmTone = 'danger',
    extraContent,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!visible) return null;

    const handleDismiss = () => {
        if (onCancel) {
            onCancel();
        } else {
            onConfirm();
        }
    };

    const getConfirmStyle = () => {
        switch (confirmTone) {
            case 'danger':
                return { bg: '#EF4444', text: '#FFFFFF', shadow: '#FCA5A5' };
            case 'success':
                return { bg: '#22C55E', text: '#FFFFFF', shadow: '#86EFAC' };
            case 'primary':
            default:
                return { bg: '#6654F4', text: '#FFFFFF', shadow: '#A5B4FC' };
        }
    };

    const toneStyle = getConfirmStyle();
    const hasCancel = !!cancelText;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleDismiss}
        >
            <Pressable style={styles.overlay} onPress={handleDismiss}>
                <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
                    <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                        <Ionicons name={icon} size={32} color={iconColor} />
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    {extraContent && <View style={styles.extraWrapper}>{extraContent}</View>}

                    <View style={styles.actionRow}>
                        {hasCancel && (
                            <Pressable
                                style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && styles.pressed]}
                                onPress={handleDismiss}
                                accessibilityRole="button"
                                accessibilityLabel={cancelText}
                            >
                                <Text style={styles.cancelText}>{cancelText}</Text>
                            </Pressable>
                        )}

                        <Pressable
                            style={({ pressed }) => [
                                styles.btn,
                                { backgroundColor: toneStyle.bg, shadowColor: toneStyle.shadow },
                                styles.confirmBtn,
                                !hasCancel && styles.fullWidthBtn,
                                pressed && styles.pressed,
                            ]}
                            onPress={onConfirm}
                            accessibilityRole="button"
                            accessibilityLabel={confirmText}
                        >
                            <Text style={[styles.confirmText, { color: toneStyle.text }]}>{confirmText}</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#1E1B4B',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontFamily: fonts.strong,
        fontSize: 21,
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontFamily: fonts.medium,
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 20,
    },
    extraWrapper: {
        width: '100%',
        marginBottom: 20,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    btn: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cancelText: {
        fontFamily: fonts.strong,
        fontSize: 15,
        color: '#475569',
    },
    confirmBtn: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    fullWidthBtn: {
        flex: 1,
        width: '100%',
    },
    confirmText: {
        fontFamily: fonts.strong,
        fontSize: 15,
    },
    pressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },
});
