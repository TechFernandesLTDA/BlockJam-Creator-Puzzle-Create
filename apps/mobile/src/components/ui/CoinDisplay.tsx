import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

interface CoinDisplayProps {
  amount: number;
}

/**
 * Formats a number with locale-appropriate separators.
 * e.g. 12500 -> "12,500"
 */
function formatAmount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 10_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return n.toLocaleString('en-US');
}

export const CoinDisplay: React.FC<CoinDisplayProps> = ({ amount }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{'\uD83E\uDE99'}</Text>
      <Text style={styles.amount}>{formatAmount(amount)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  icon: {
    fontSize: 16,
  },
  amount: {
    color: colors.blocks.yellow,
    fontSize: 15,
    fontWeight: '700',
  },
});
