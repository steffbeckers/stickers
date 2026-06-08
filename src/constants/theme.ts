import { Platform } from 'react-native';

export const colors = {
  pitch:     '#16b364',
  pitchDeep: '#0e8a49',
  pitchDark: '#06301c',
  ink:       '#0f1712',
  inkSoft:   '#3a4a40',
  muted:     '#7a8c82',
  faint:     '#b0bdb6',
  bg:        '#f8f9f6',
  surface:   '#ffffff',
  lineSoft:  'rgba(15,23,30,0.08)',
  line:      'rgba(15,23,30,0.14)',
  blue:      '#1b5fb0',
  magenta:   '#c4297a',
  gold:      '#caa24a',
  amber:     '#e07c1a',
} as const;

export const fonts = {
  display: 'Anton',
  ui:      'Roboto',
} as const;

export const shadows = {
  sm: Platform.select({
    android: { elevation: 2 },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    default: { elevation: 2 },
  }) as object,
  md: Platform.select({
    android: { elevation: 6 },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 12,
    },
    default: { elevation: 6 },
  }) as object,
} as const;
