import { MD3DarkTheme, configureFonts } from 'react-native-paper';
import { colors } from './colors';
import { typography } from './typography';

const fontConfig = {
  displayLarge: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['4xl'],
    lineHeight: 56,
    letterSpacing: 0,
  },
  displayMedium: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['3xl'],
    lineHeight: 48,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes['2xl'],
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineLarge: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    lineHeight: 32,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    lineHeight: 28,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.md,
    lineHeight: 24,
    letterSpacing: 0,
  },
  titleLarge: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.base,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.base,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.xs,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const;

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.ui.accent,
    onPrimary: colors.ui.text,
    primaryContainer: colors.bg.elevated,
    onPrimaryContainer: colors.ui.text,
    secondary: colors.ui.accentGlow,
    onSecondary: colors.ui.text,
    background: colors.bg.primary,
    onBackground: colors.ui.text,
    surface: colors.bg.secondary,
    onSurface: colors.ui.text,
    surfaceVariant: colors.bg.surface,
    onSurfaceVariant: colors.ui.textSoft,
    error: colors.ui.error,
    onError: colors.ui.text,
    outline: colors.ui.border,
  },
  fonts: configureFonts({ config: fontConfig }),
};

export type AppTheme = typeof theme;
