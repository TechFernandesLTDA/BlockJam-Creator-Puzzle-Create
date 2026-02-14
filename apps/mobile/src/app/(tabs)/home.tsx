import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';
import { useFeedStore } from '@/stores/useFeedStore';
import type { RootStackParamList } from '@/types/navigation';
import type { LevelSummary, FeedSort } from '@blockjam/shared';

// ---------------------------------------------------------------------------
// Component stubs for FeedList and CoinDisplay.
// These are declared inline so the screen is self-contained until the real
// components are created under @/components/*.
// When the real components exist, swap the imports below.
// ---------------------------------------------------------------------------

// import FeedList from '@/components/feed/FeedList';
// import CoinDisplay from '@/components/ui/CoinDisplay';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_LEVELS: LevelSummary[] = [
  {
    id: 'lvl-001',
    name: 'Neon Cascade',
    creatorId: 'u1',
    creatorName: 'PixelMaster',
    creatorAvatar: null,
    gridSize: 8,
    difficulty: 'easy',
    likesCount: 234,
    playsCount: 1820,
    completionRate: 0.72,
    thumbnailUrl: null,
    isOfficial: false,
    isFeatured: true,
    isLiked: false,
    createdAt: '2025-12-01T10:00:00Z',
  },
  {
    id: 'lvl-002',
    name: 'Block Breaker',
    creatorId: 'u2',
    creatorName: 'GameGuru',
    creatorAvatar: null,
    gridSize: 6,
    difficulty: 'medium',
    likesCount: 189,
    playsCount: 1450,
    completionRate: 0.58,
    thumbnailUrl: null,
    isOfficial: false,
    isFeatured: false,
    isLiked: true,
    createdAt: '2025-11-28T14:30:00Z',
  },
  {
    id: 'lvl-003',
    name: 'Spiral Maze',
    creatorId: 'u3',
    creatorName: 'PuzzleWiz',
    creatorAvatar: null,
    gridSize: 10,
    difficulty: 'hard',
    likesCount: 412,
    playsCount: 2100,
    completionRate: 0.35,
    thumbnailUrl: null,
    isOfficial: false,
    isFeatured: true,
    isLiked: false,
    createdAt: '2025-11-25T08:15:00Z',
  },
  {
    id: 'lvl-004',
    name: 'Color Clash',
    creatorId: 'u4',
    creatorName: 'ArtBlock',
    creatorAvatar: null,
    gridSize: 8,
    difficulty: 'easy',
    likesCount: 98,
    playsCount: 670,
    completionRate: 0.81,
    thumbnailUrl: null,
    isOfficial: false,
    isFeatured: false,
    isLiked: false,
    createdAt: '2025-11-20T16:45:00Z',
  },
  {
    id: 'lvl-005',
    name: 'Tetris Tribute',
    creatorId: 'u5',
    creatorName: 'RetroFan',
    creatorAvatar: null,
    gridSize: 10,
    difficulty: 'expert',
    likesCount: 567,
    playsCount: 3200,
    completionRate: 0.18,
    thumbnailUrl: null,
    isOfficial: false,
    isFeatured: true,
    isLiked: true,
    createdAt: '2025-11-18T12:00:00Z',
  },
  {
    id: 'lvl-006',
    name: 'Zen Garden',
    creatorId: 'u6',
    creatorName: 'CalmCreator',
    creatorAvatar: null,
    gridSize: 6,
    difficulty: 'easy',
    likesCount: 321,
    playsCount: 2400,
    completionRate: 0.89,
    thumbnailUrl: null,
    isOfficial: false,
    isFeatured: false,
    isLiked: false,
    createdAt: '2025-11-15T09:30:00Z',
  },
  {
    id: 'lvl-007',
    name: 'Inferno Rush',
    creatorId: 'u7',
    creatorName: 'BlazeMaker',
    creatorAvatar: null,
    gridSize: 8,
    difficulty: 'hard',
    likesCount: 276,
    playsCount: 1900,
    completionRate: 0.42,
    thumbnailUrl: null,
    isOfficial: false,
    isFeatured: false,
    isLiked: true,
    createdAt: '2025-11-12T18:20:00Z',
  },
  {
    id: 'lvl-008',
    name: 'Crystal Caves',
    creatorId: 'u8',
    creatorName: 'GemHunter',
    creatorAvatar: null,
    gridSize: 10,
    difficulty: 'medium',
    likesCount: 145,
    playsCount: 980,
    completionRate: 0.55,
    thumbnailUrl: null,
    isOfficial: false,
    isFeatured: false,
    isLiked: false,
    createdAt: '2025-11-10T07:10:00Z',
  },
  {
    id: 'lvl-009',
    name: 'Pixel Panic',
    creatorId: 'u9',
    creatorName: 'ChaosCrafter',
    creatorAvatar: null,
    gridSize: 8,
    difficulty: 'expert',
    likesCount: 489,
    playsCount: 2800,
    completionRate: 0.12,
    thumbnailUrl: null,
    isOfficial: false,
    isFeatured: true,
    isLiked: false,
    createdAt: '2025-11-08T21:00:00Z',
  },
  {
    id: 'lvl-010',
    name: 'Rainbow Road',
    creatorId: 'u10',
    creatorName: 'SpectrumDev',
    creatorAvatar: null,
    gridSize: 6,
    difficulty: 'medium',
    likesCount: 203,
    playsCount: 1350,
    completionRate: 0.63,
    thumbnailUrl: null,
    isOfficial: false,
    isFeatured: false,
    isLiked: true,
    createdAt: '2025-11-05T13:40:00Z',
  },
];

// ---------------------------------------------------------------------------
// Inline CoinDisplay (until @/components/ui/CoinDisplay exists)
// ---------------------------------------------------------------------------

function CoinDisplay({ coins }: { coins: number }) {
  return (
    <View style={styles.coinContainer}>
      <Text style={styles.coinIcon}>{'\u2B50'}</Text>
      <Text style={styles.coinText}>{coins.toLocaleString()}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Difficulty badge colour helper
// ---------------------------------------------------------------------------

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: colors.ui.success,
  medium: colors.ui.warning,
  hard: colors.ui.error,
  expert: colors.blocks.purple,
};

// ---------------------------------------------------------------------------
// Inline FeedList (until @/components/feed/FeedList exists)
// ---------------------------------------------------------------------------

interface FeedListProps {
  levels: LevelSummary[];
  onPressLevel: (level: LevelSummary) => void;
  onLike: (levelId: string) => void;
  onEndReached: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  isLoading: boolean;
}

function FeedList({
  levels,
  onPressLevel,
  onLike,
  onEndReached,
  refreshing,
  onRefresh,
  isLoading,
}: FeedListProps) {
  const renderItem = useCallback(
    ({ item }: { item: LevelSummary }) => (
      <TouchableOpacity
        style={styles.feedCard}
        activeOpacity={0.7}
        onPress={() => onPressLevel(item)}
      >
        {/* Thumbnail placeholder */}
        <View
          style={[
            styles.feedThumbnail,
            { backgroundColor: DIFFICULTY_COLORS[item.difficulty] ?? colors.ui.accent },
          ]}
        >
          <Text style={styles.feedThumbnailText}>
            {item.gridSize}x{item.gridSize}
          </Text>
        </View>

        {/* Level info */}
        <View style={styles.feedCardBody}>
          <Text style={styles.feedLevelName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.feedCreator} numberOfLines={1}>
            by {item.creatorName}
          </Text>

          <View style={styles.feedMeta}>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: DIFFICULTY_COLORS[item.difficulty] ?? colors.ui.accent },
              ]}
            >
              <Text style={styles.difficultyText}>
                {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
              </Text>
            </View>

            <Text style={styles.feedStat}>
              {'\u25B6'} {item.playsCount}
            </Text>
          </View>
        </View>

        {/* Like button */}
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => onLike(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.likeIcon, item.isLiked && styles.likeIconActive]}>
            {item.isLiked ? '\u2665' : '\u2661'}
          </Text>
          <Text style={[styles.likeCount, item.isLiked && styles.likeCountActive]}>
            {item.likesCount}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [onPressLevel, onLike],
  );

  const renderFooter = useCallback(() => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  }, [isLoading]);

  return (
    <FlatList
      data={levels}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.feedListContent}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.ui.accent}
          colors={[colors.ui.accent]}
          progressBackgroundColor={colors.bg.surface}
        />
      }
      ListFooterComponent={renderFooter}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No levels found</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Sort filter bar
// ---------------------------------------------------------------------------

const SORT_OPTIONS: { label: string; value: FeedSort }[] = [
  { label: 'Trending', value: 'trending' },
  { label: 'New', value: 'new' },
  { label: 'Top', value: 'top' },
];

// ---------------------------------------------------------------------------
// Home Screen
// ---------------------------------------------------------------------------

type HomeNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<HomeNavProp>();

  const levels = useFeedStore((s) => s.levels);
  const sort = useFeedStore((s) => s.sort);
  const isLoading = useFeedStore((s) => s.isLoading);
  const hasMore = useFeedStore((s) => s.hasMore);
  const setSort = useFeedStore((s) => s.setSort);
  const setLevels = useFeedStore((s) => s.setLevels);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const setLoading = useFeedStore((s) => s.setLoading);

  const [refreshing, setRefreshing] = useState(false);

  // Seed mock data on first mount
  useEffect(() => {
    if (levels.length === 0) {
      setLoading(true);
      // Simulate network delay
      const timer = setTimeout(() => {
        setLevels(MOCK_LEVELS);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSortChange = useCallback(
    (newSort: FeedSort) => {
      if (newSort === sort) return;
      setSort(newSort);
      // Re-populate with mock data (in a real app this would be a network call)
      setLoading(true);
      setTimeout(() => {
        setLevels(MOCK_LEVELS);
        setLoading(false);
      }, 400);
    },
    [sort, setSort, setLevels, setLoading],
  );

  const handlePressLevel = useCallback(
    (level: LevelSummary) => {
      navigation.navigate('game/[levelId]', { levelId: level.id });
    },
    [navigation],
  );

  const handleLike = useCallback(
    (levelId: string) => {
      toggleLike(levelId);
    },
    [toggleLike],
  );

  const handleEndReached = useCallback(() => {
    if (isLoading || !hasMore) return;
    // In a real app this would fetch the next page
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [isLoading, hasMore, setLoading]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setLevels(MOCK_LEVELS);
      setRefreshing(false);
    }, 600);
  }, [setLevels]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor={colors.bg.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>BlockJam</Text>
        <CoinDisplay coins={1250} />
      </View>

      {/* Sort filter bar */}
      <View style={styles.sortBar}>
        {SORT_OPTIONS.map((option) => {
          const isActive = sort === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.sortPill, isActive && styles.sortPillActive]}
              onPress={() => handleSortChange(option.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sortPillText, isActive && styles.sortPillTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Feed */}
      <FeedList
        levels={levels}
        onPressLevel={handlePressLevel}
        onLike={handleLike}
        onEndReached={handleEndReached}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // -- Header ----------------------------------------------------------------
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  appTitle: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['2xl'],
    color: colors.ui.text,
  },

  // -- Coin display ----------------------------------------------------------
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  coinIcon: {
    fontSize: typography.sizes.base,
    marginRight: spacing.xs,
  },
  coinText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.base,
    color: colors.ui.text,
  },

  // -- Sort bar --------------------------------------------------------------
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  sortPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  sortPillActive: {
    backgroundColor: colors.ui.accent,
    borderColor: colors.ui.accent,
  },
  sortPillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.ui.textSoft,
  },
  sortPillTextActive: {
    color: colors.ui.text,
  },

  // -- Feed list -------------------------------------------------------------
  feedListContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 100, // extra space for bottom tab bar
  },

  // -- Feed card -------------------------------------------------------------
  feedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  feedThumbnail: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedThumbnailText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    color: colors.ui.text,
  },
  feedCardBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  feedLevelName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.base,
    color: colors.ui.text,
    marginBottom: 2,
  },
  feedCreator: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.ui.textSoft,
    marginBottom: spacing.xs,
  },
  feedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.xs,
    color: colors.ui.text,
  },
  feedStat: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: colors.ui.textSoft,
  },

  // -- Like button -----------------------------------------------------------
  likeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  likeIcon: {
    fontSize: typography.sizes.xl,
    color: colors.ui.textSoft,
  },
  likeIconActive: {
    color: colors.ui.error,
  },
  likeCount: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.xs,
    color: colors.ui.textSoft,
    marginTop: 2,
  },
  likeCountActive: {
    color: colors.ui.error,
  },

  // -- Loading / Empty -------------------------------------------------------
  loadingFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.ui.textSoft,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    color: colors.ui.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.ui.textSoft,
  },
});
