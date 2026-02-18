import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TipBubbleProps {
  /** The tip message to display. */
  message: string;
  /** Whether the bubble should be visible. */
  visible: boolean;
  /** Called when the user dismisses the tip. */
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SLIDE_DURATION = 200;
const AUTO_DISMISS_MS = 6000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TipBubble: React.FC<TipBubbleProps> = ({ message, visible, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(-60);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        onDismiss();
      }, AUTO_DISMISS_MS);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -60,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.bubble,
          { transform: [{ translateY }], opacity },
        ]}
      >
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity
          style={styles.dismissButton}
          activeOpacity={0.6}
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dismissText}>{'\u00D7'}</Text>
        </TouchableOpacity>
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
    top: 120,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 150,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.ui.accent,
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 8,
    shadowColor: colors.ui.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.ui.text,
    lineHeight: 18,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  dismissText: {
    fontSize: 20,
    color: colors.ui.textSoft,
    fontWeight: '700',
  },
});

export default React.memo(TipBubble);
