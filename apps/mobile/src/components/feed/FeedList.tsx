import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { LevelSummary } from '@blockjam/shared';
import { colors } from '@/theme/colors';
import { FeedCard } from './FeedCard';

interface FeedListProps {
  levels: LevelSummary[];
  onLoadMore: () => void;
  isLoading: boolean;
  onLevelPress: (id: string) => void;
  onLike: (id: string) => void;
}

export const FeedList: React.FC<FeedListProps> = ({
  levels,
  onLoadMore,
  isLoading,
  onLevelPress,
  onLike,
}) => {
  const renderItem = useCallback(
    ({ item }: { item: LevelSummary }) => (
      <FeedCard
        level={item}
        onPress={() => onLevelPress(item.id)}
        onLike={() => onLike(item.id)}
      />
    ),
    [onLevelPress, onLike],
  );

  const keyExtractor = useCallback((item: LevelSummary) => item.id, []);

  const renderFooter = useCallback(() => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.ui.accent} />
      </View>
    );
  }, [isLoading]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>{'\uD83C\uDFAE'}</Text>
        <Text style={styles.emptyTitle}>No Levels Yet</Text>
        <Text style={styles.emptySubtitle}>
          Be the first to create a level for others to play!
        </Text>
      </View>
    );
  }, [isLoading]);

  const handleEndReached = useCallback(() => {
    if (!isLoading) {
      onLoadMore();
    }
  }, [isLoading, onLoadMore]);

  return (
    <FlatList
      data={levels}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={onLoadMore}
          tintColor={colors.ui.accent}
          colors={[colors.ui.accent]}
          progressBackgroundColor={colors.bg.surface}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.ui.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: colors.ui.textSoft,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
