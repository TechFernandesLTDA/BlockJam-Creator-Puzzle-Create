import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '@/theme/colors';

interface LikeButtonProps {
  isLiked: boolean;
  count: number;
  onPress: () => void;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  isLiked,
  count,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    // Scale up then back to normal
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 50,
        bounciness: 12,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 8,
      }),
    ]).start();

    onPress();
  }, [onPress, scaleAnim]);

  const heartColor = isLiked ? colors.blocks.red : colors.ui.textSoft;

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <View style={styles.container}>
        <Animated.Text
          style={[
            styles.heart,
            { color: heartColor, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {'\u2665'}
        </Animated.Text>
        <Text style={styles.count}>{formatCount(count)}</Text>
      </View>
    </Pressable>
  );
};

/**
 * Formats large numbers into a compact representation.
 * e.g. 1200 -> "1.2K", 1000000 -> "1M"
 */
function formatCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(n);
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heart: {
    fontSize: 18,
  },
  count: {
    color: colors.ui.textSoft,
    fontSize: 13,
    fontWeight: '600',
  },
});
