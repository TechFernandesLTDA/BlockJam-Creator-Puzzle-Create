import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Difficulty } from '@blockjam/shared';
import { colors } from '@/theme/colors';

interface DifficultyTagProps {
  difficulty: Difficulty;
}

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: colors.blocks.green,
  medium: colors.blocks.yellow,
  hard: colors.blocks.orange,
  expert: colors.blocks.red,
};

export const DifficultyTag: React.FC<DifficultyTagProps> = ({ difficulty }) => {
  const backgroundColor = DIFFICULTY_COLORS[difficulty];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={styles.text}>{difficulty.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    color: colors.ui.text,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
