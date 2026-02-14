import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BannerAdProps {
  /** Optional additional styles for the banner container. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Placeholder banner ad view.
 * Will be replaced with a real AdMob `BannerAd` component once
 * react-native-google-mobile-ads is integrated.
 */
const BannerAd: React.FC<BannerAdProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>Ad</Text>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ui.textSoft,
    letterSpacing: 1,
  },
});

export default React.memo(BannerAd);
