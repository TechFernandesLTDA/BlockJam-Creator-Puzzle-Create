import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
}

const BASE_COLOR = colors.bg.surface; // #1C2251
const SHIMMER_COLOR = colors.bg.elevated; // #252B6A (slightly lighter)

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = 8,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmerAnim]);

  const backgroundColor = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BASE_COLOR, SHIMMER_COLOR],
  });

  const animatedStyle: Animated.WithAnimatedObject<ViewStyle> = {
    width,
    height,
    borderRadius,
    backgroundColor,
  };

  return <Animated.View style={[styles.skeleton, animatedStyle]} />;
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});
