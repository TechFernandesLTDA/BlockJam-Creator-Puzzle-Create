import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';

interface GradientButtonProps {
  title?: string;
  label?: string;
  onPress: () => void;
  gradient?: string[];
  disabled?: boolean;
  style?: ViewStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  label,
  onPress,
  disabled = false,
  style,
}) => {
  const displayText = title ?? label ?? '';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={styles.text}>{displayText}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.ui.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.ui.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
