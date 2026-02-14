import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onDismiss: () => void;
}

const TYPE_CONFIG: Record<ToastType, { color: string; icon: string }> = {
  success: { color: colors.blocks.green, icon: '\u2713' },
  error: { color: colors.blocks.red, icon: '\u2717' },
  info: { color: colors.ui.accent, icon: '\u2139' },
};

const AUTO_DISMISS_MS = 3000;

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  visible,
  onDismiss,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Slide in from top
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 4,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, AUTO_DISMISS_MS);
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, translateY, opacity, onDismiss]);

  const config = TYPE_CONFIG[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
          borderLeftColor: config.color,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Pressable onPress={onDismiss} style={styles.inner}>
        <View style={[styles.iconCircle, { backgroundColor: config.color }]}>
          <Text style={styles.icon}>{config.icon}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: colors.bg.secondary,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.ui.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: colors.ui.text,
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    flex: 1,
    color: colors.ui.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
