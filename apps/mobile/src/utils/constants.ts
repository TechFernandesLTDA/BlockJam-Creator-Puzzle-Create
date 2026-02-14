import { Platform } from 'react-native';

/**
 * Base URL for the BlockJam API.
 * In production builds this should point to the live server.
 * __DEV__ is a React Native global that is true during development.
 */
export const API_URL: string = __DEV__
  ? Platform.select({
      android: 'http://10.0.2.2:3000/api',
      default: 'http://localhost:3000/api',
    }) ?? 'http://localhost:3000/api'
  : 'https://api.blockjam.app/api';

/**
 * AdMob unit IDs.
 * These are the official Google-provided test IDs.
 * Replace with real ad unit IDs before production release.
 */
export const AD_UNIT_IDS = {
  banner: Platform.select({
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
    default: 'ca-app-pub-3940256099942544/6300978111',
  }) as string,
  interstitial: Platform.select({
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
    default: 'ca-app-pub-3940256099942544/1033173712',
  }) as string,
  rewarded: Platform.select({
    android: 'ca-app-pub-3940256099942544/5224354917',
    ios: 'ca-app-pub-3940256099942544/1712485313',
    default: 'ca-app-pub-3940256099942544/5224354917',
  }) as string,
} as const;

/**
 * Default spring animation configuration used with react-native-reanimated.
 */
export const ANIMATION_CONFIG = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  springSnappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  springGentle: {
    damping: 22,
    stiffness: 100,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  timing: {
    short: 150,
    medium: 300,
    long: 500,
  },
} as const;

/**
 * Canonical screen names used throughout navigation.
 * Keeps string references in one place to avoid typos.
 */
export const SCREEN_NAMES = {
  AUTH_LOGIN: 'auth/login',
  AUTH_ONBOARDING: 'auth/onboarding',
  TABS: '(tabs)',
  TAB_HOME: 'Home',
  TAB_PLAY: 'Play',
  TAB_CREATE: 'Create',
  TAB_PROFILE: 'Profile',
  GAME_LEVEL: 'game/[levelId]',
} as const;

/**
 * MMKV storage keys.
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth.token',
  USER_PROFILE: 'user.profile',
  ONBOARDING_COMPLETE: 'onboarding.complete',
  THEME_PREFERENCE: 'theme.preference',
} as const;

/**
 * Pagination defaults.
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
} as const;
