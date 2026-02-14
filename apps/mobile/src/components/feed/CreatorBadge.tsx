import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

interface CreatorBadgeProps {
  name: string;
  avatarUrl: string | null;
}

export const CreatorBadge: React.FC<CreatorBadgeProps> = ({
  name,
  avatarUrl,
}) => {
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
};

const AVATAR_SIZE = 28;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.bg.surface,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.ui.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.ui.text,
    fontSize: 13,
    fontWeight: '700',
  },
  name: {
    color: colors.ui.textSoft,
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 120,
  },
});
