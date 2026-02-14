import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';
import { useUserStore } from '@/stores/useUserStore';
import { loginWithGoogle, loginAsGuest, getToken } from '@/services/authService';
import { SCREEN_NAMES, STORAGE_KEYS } from '@/utils/constants';
import type { RootStackParamList } from '@/types/navigation';

// ---------------------------------------------------------------------------
// Navigation helper type
// ---------------------------------------------------------------------------

type LoginNavProp = NativeStackNavigationProp<RootStackParamList, 'auth/login'>;

// ---------------------------------------------------------------------------
// MMKV storage helper (mirrors authService pattern)
// ---------------------------------------------------------------------------

function getOnboardingComplete(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv');
    const storage = new MMKV();
    return storage.getString(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
  } catch {
    return false;
  }
}

function setOnboardingComplete(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv');
    const storage = new MMKV();
    storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  } catch {
    // Swallow -- not critical.
  }
}

// ---------------------------------------------------------------------------
// Unique device ID for guest login
// ---------------------------------------------------------------------------

let cachedDeviceId: string | null = null;

function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;

  // Attempt to read a persisted device ID first.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv');
    const storage = new MMKV();
    const stored = storage.getString('device.id');
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
    // Generate a simple pseudo-random ID and persist it.
    const id =
      'guest_' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).substring(2, 10);
    storage.set('device.id', id);
    cachedDeviceId = id;
    return id;
  } catch {
    const id =
      'guest_' +
      Date.now().toString(36) +
      '_' +
      Math.random().toString(36).substring(2, 10);
    cachedDeviceId = id;
    return id;
  }
}

// ---------------------------------------------------------------------------
// Login Screen
// ---------------------------------------------------------------------------

export default function LoginScreen(): React.JSX.Element {
  const navigation = useNavigation<LoginNavProp>();
  const setUser = useUserStore((s) => s.setUser);
  const setLoading = useUserStore((s) => s.setLoading);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Determine where to navigate after a successful login.
  const navigateAfterLogin = useCallback(() => {
    const onboardingDone = getOnboardingComplete();
    if (onboardingDone) {
      navigation.reset({ index: 0, routes: [{ name: SCREEN_NAMES.TABS }] });
    } else {
      navigation.navigate(SCREEN_NAMES.AUTH_ONBOARDING);
    }
  }, [navigation]);

  // ---- Google sign-in handler ----
  const handleGoogleSignIn = useCallback(async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    setLoading(true);

    try {
      // In a production app the Google ID token would come from
      // @react-native-google-signin/google-signin.  Here we use a
      // placeholder string so the rest of the flow is exercised.
      const idToken = 'GOOGLE_ID_TOKEN_PLACEHOLDER';
      const { user } = await loginWithGoogle(idToken);
      setUser(user);
      navigateAfterLogin();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsGoogleLoading(false);
      setLoading(false);
    }
  }, [setUser, setLoading, navigateAfterLogin]);

  // ---- Guest login handler ----
  const handleGuestLogin = useCallback(async () => {
    setErrorMessage(null);
    setIsGuestLoading(true);
    setLoading(true);

    try {
      const deviceId = getDeviceId();
      const { user } = await loginAsGuest(deviceId);
      setUser(user);
      navigateAfterLogin();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Guest login failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsGuestLoading(false);
      setLoading(false);
    }
  }, [setUser, setLoading, navigateAfterLogin]);

  const isAnyLoading = isGoogleLoading || isGuestLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* ---- Logo Area ---- */}
        <View style={styles.logoArea}>
          <Text style={styles.blockEmojis}>
            <Text style={{ color: colors.blocks.red }}>{'\u2B1B'}</Text>
            <Text style={{ color: colors.blocks.blue }}>{'\u2B1C'}</Text>
            <Text style={{ color: colors.blocks.green }}>{'\u2B1B'}</Text>
            <Text style={{ color: colors.blocks.yellow }}>{'\u2B1C'}</Text>
          </Text>
          <Text style={styles.appTitle}>BlockJam</Text>
          <Text style={styles.tagline}>Puzzle & Create</Text>
        </View>

        {/* ---- Spacer ---- */}
        <View style={styles.spacer} />

        {/* ---- Error message ---- */}
        {errorMessage !== null && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* ---- Buttons ---- */}
        <View style={styles.buttonGroup}>
          {/* Sign in with Google */}
          <TouchableOpacity
            style={[styles.googleButton, isAnyLoading && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={handleGoogleSignIn}
            disabled={isAnyLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Play as Guest */}
          <TouchableOpacity
            style={[styles.guestButton, isAnyLoading && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={handleGuestLogin}
            disabled={isAnyLoading}
          >
            {isGuestLoading ? (
              <ActivityIndicator size="small" color={colors.ui.accent} />
            ) : (
              <Text style={styles.guestButtonText}>Play as Guest</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ---- Terms of Service ---- */}
        <Text style={styles.termsText}>
          By continuing, you agree to BlockJam's{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },

  // -- Logo area --------------------------------------------------------------
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  blockEmojis: {
    fontSize: 48,
    letterSpacing: 8,
    marginBottom: spacing.md,
  },
  appTitle: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['4xl'],
    color: colors.ui.text,
    letterSpacing: 1,
  },
  tagline: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.lg,
    color: colors.ui.textSoft,
    marginTop: spacing.xs,
  },

  // -- Spacer -----------------------------------------------------------------
  spacer: {
    flex: 1,
    maxHeight: 80,
  },

  // -- Error ------------------------------------------------------------------
  errorBanner: {
    backgroundColor: 'rgba(255, 59, 111, 0.15)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginBottom: spacing.base,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.ui.error,
  },
  errorText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.ui.error,
    textAlign: 'center',
  },

  // -- Buttons ----------------------------------------------------------------
  buttonGroup: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  googleIcon: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes.xl,
    color: '#4285F4',
    marginRight: spacing.md,
  },
  googleButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.base,
    color: '#1F1F1F',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    height: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.ui.accent,
    paddingHorizontal: spacing.base,
  },
  guestButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.base,
    color: colors.ui.accent,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // -- Terms ------------------------------------------------------------------
  termsText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: colors.ui.textSoft,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.lg,
  },
  termsLink: {
    color: colors.ui.accent,
    textDecorationLine: 'underline',
  },
});
