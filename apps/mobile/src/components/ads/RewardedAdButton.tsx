import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RewardedAdButtonProps {
  /** Primary label shown on the button. */
  title: string;
  /** Callback fired after the user has watched the ad (or placeholder delay). */
  onReward: () => void;
  /** Optional additional styles for the button container. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Simulated ad viewing duration in milliseconds. */
const SIMULATED_AD_DELAY_MS = 1500;

const REWARD_COLOR = '#FBBF24'; // gold / yellow

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
  title,
  onReward,
  style,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePress = useCallback(() => {
    if (loading) return;

    setLoading(true);
    console.log('[RewardedAdButton] Simulating rewarded ad...');

    // Placeholder: simulate ad view, then fire reward callback.
    setTimeout(() => {
      setLoading(false);
      onReward();
    }, SIMULATED_AD_DELAY_MS);
  }, [loading, onReward]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={loading}
      style={[styles.button, loading && styles.buttonLoading, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.bg.primary} />
      ) : (
        <View style={styles.content}>
          {/* Play / video icon */}
          <Text style={styles.icon}>{'\u25B6'}</Text>
          <View style={styles.textGroup}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Watch Ad</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    backgroundColor: REWARD_COLOR,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 18,
    color: colors.bg.primary,
  },
  textGroup: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.bg.primary,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(10, 14, 39, 0.6)',
    marginTop: 1,
  },
});

export default React.memo(RewardedAdButton);
