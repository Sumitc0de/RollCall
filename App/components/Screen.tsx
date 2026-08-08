import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView, NativeSafeAreaViewProps } from 'react-native-safe-area-context';
import { colors } from '../theme';

interface ScreenProps extends PropsWithChildren {
  keyboard?: boolean;
  style?: any;
  edges?: NativeSafeAreaViewProps['edges'];
}

export function Screen({ children, keyboard = false, style, edges = ['top', 'left', 'right'] }: ScreenProps) {
  const content = (
    <SafeAreaView edges={edges} style={[styles.safe, style]}>
      {children}
    </SafeAreaView>
  );

  return keyboard ? (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1, backgroundColor: colors.background },
});

