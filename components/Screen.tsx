import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

export function Screen({ children, keyboard = false, style }: PropsWithChildren<{ keyboard?: boolean; style?: any }>) {
  const content = <SafeAreaView edges={[]} style={[styles.safe, style]}>{children}</SafeAreaView>;
  return keyboard ? (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
});
