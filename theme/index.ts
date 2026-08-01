import { Platform } from 'react-native';

export const colors = {
  background: '#F8FAFC', surface: '#FFFFFF', text: '#263238', muted: '#718078',
  border: '#E6E3DA', primary: '#66BB6A', primarySoft: '#E8F5E9',
  success: '#388E3C', successSoft: '#E8F5E9', danger: '#C62828', dangerSoft: '#FFEBD3',
  warning: '#9A6B16', warningSoft: '#FDF0D5', cream: '#FDF0D5',
};
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
export const radius = { sm: 10, md: 14, lg: 18, xl: 22, pill: 999 };
export const layout = { maxContentWidth: 720, minTouchTarget: 44 };
export const shadow = Platform.select({ ios: { shadowColor: '#17213A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 2 }, default: {} });
export const fonts = {
  body: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  display: 'Nunito_700Bold',
  strong: 'Nunito_800ExtraBold',
};
