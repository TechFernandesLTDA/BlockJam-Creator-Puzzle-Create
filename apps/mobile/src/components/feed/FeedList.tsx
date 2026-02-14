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
  onLoadMore?: () => void;
  onEndReached?: () => void;
  isLoading: boolean;
  onLevelPress?: (id: string) => void;
  onPressLevel?: (level: LevelSummary) => void;
  onLike: (id: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const FeedList: React.FC<FeedListProps> = ({
  levels,
  onLoadMore,
  onEndReached,
  isLoading,
  onLevelPress,
  onPressLevel,
  onLike,
  refreshing,
  onRefresh,
}) => {
  const handleLoadMore = onEndReached ?? onLoadMore ?? (() => {});
  const handleRefresh = onRefresh ?? onLoadMore ?? (() => {});
  const handleLevelPress = (item: LevelSummary) => {
    if (onPressLevel) {
      onPressLevel(item);
    } else if (onLevelPress) {
      onLevelPress(item.id);
    }
  };
  const renderItem = useCallback(
    ({ item }: { item: LevelSummary }) => (
      <FeedCard
        level={item}
        onPress={() => handleLevelPress(item)}
        onLike={() => onLike(item.id)}
      />
    ),
    [onLike, onLevelPress, onPressLevel],
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

  const handleEndReachedCb = useCallback(() => {
    if (!isLoading) {
      handleLoadMore();
    }
  }, [isLoading, handleLoadMore]);

  return (
    <FlatList
      data={levels}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReachedCb}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={refreshing ?? false}
          onRefresh={handleRefresh}
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
