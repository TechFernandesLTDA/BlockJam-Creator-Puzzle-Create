import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ComboEffectProps {
  /** Current combo multiplier. */
  combo: number;
  /** Whether the effect should be displayed. */
  visible: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How long the combo text stays visible before fading out. */
const DISPLAY_DURATION_MS = 1500;
/** How long the fade-out animation takes. */
const FADE_OUT_MS = 300;

/**
 * Colour intensifies as combos increase.
 */
function getComboColor(combo: number): string {
  if (combo >= 5) return colors.blocks.red;
  if (combo >= 4) return colors.blocks.orange;
  if (combo >= 3) return colors.blocks.yellow;
  return colors.ui.accent;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ComboEffect: React.FC<ComboEffectProps> = ({ combo, visible }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible && combo > 1) {
      // Reset to start values
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);
      translateYAnim.setValue(20);

      // Entrance animation: scale up + fade in + slide up
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();

      // Schedule exit animation after DISPLAY_DURATION_MS
      const exitTimer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: FADE_OUT_MS,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: -30,
            duration: FADE_OUT_MS,
            useNativeDriver: true,
          }),
        ]).start();
      }, DISPLAY_DURATION_MS);

      return () => clearTimeout(exitTimer);
    } else {
      // Immediately hide
      opacityAnim.setValue(0);
    }
  }, [visible, combo, scaleAnim, opacityAnim, translateYAnim]);

  if (!visible || combo <= 1) return null;

  const comboColor = getComboColor(combo);

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.badge,
          {
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim },
            ],
            shadowColor: comboColor,
          },
        ]}
      >
        <Text style={[styles.comboText, { color: comboColor }]}>
          {combo}x COMBO!
        </Text>
      </Animated.View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  badge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.bg.secondary,
    borderWidth: 2,
    borderColor: colors.ui.border,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  comboText: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['2xl'],
    textAlign: 'center',
    letterSpacing: 2,
  },
});

export default React.memo(ComboEffect);
