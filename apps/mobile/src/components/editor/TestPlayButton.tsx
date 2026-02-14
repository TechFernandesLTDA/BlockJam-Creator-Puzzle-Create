import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { colors } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestPlayButtonProps {
  /** Callback when the button is pressed. */
  onPress: () => void;
  /** Whether the button is disabled (e.g. empty grid). */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TestPlayButton: React.FC<TestPlayButtonProps> = ({
  onPress,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={[styles.icon, disabled && styles.textDisabled]}>
        {'\u25B6'}
      </Text>
      <Text style={[styles.label, disabled && styles.textDisabled]}>
        Test Play
      </Text>
    </TouchableOpacity>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.ui.accent,
    backgroundColor: 'transparent',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 16,
    color: colors.ui.accent,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ui.text,
  },
  textDisabled: {
    color: colors.ui.textSoft,
  },
});

export default React.memo(TestPlayButton);
