import React, { useCallback } from 'react';
import {
  ScrollView,
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
import type { RootStackParamList } from '@/types/navigation';
import type { Difficulty } from '@blockjam/shared';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignLevel {
  id: string;
  number: number;
  name: string;
  difficulty: Difficulty;
  stars: number; // 0-3, 0 = not completed
  isLocked: boolean;
}

interface DifficultySection {
  title: string;
  difficulty: Difficulty;
  levels: CampaignLevel[];
}

// ---------------------------------------------------------------------------
// Difficulty colour map
// ---------------------------------------------------------------------------

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: colors.ui.success,
  medium: colors.ui.warning,
  hard: colors.ui.error,
  expert: colors.blocks.purple,
};

const DIFFICULTY_BG: Record<Difficulty, string> = {
  easy: 'rgba(34, 214, 138, 0.15)',
  medium: 'rgba(251, 191, 36, 0.15)',
  hard: 'rgba(255, 59, 111, 0.15)',
  expert: 'rgba(168, 85, 247, 0.15)',
};

// ---------------------------------------------------------------------------
// Mock campaign data
// ---------------------------------------------------------------------------

const CAMPAIGN_SECTIONS: DifficultySection[] = [
  {
    title: 'Easy',
    difficulty: 'easy',
    levels: [
      { id: 'c-e1', number: 1, name: 'First Steps', difficulty: 'easy', stars: 3, isLocked: false },
      { id: 'c-e2', number: 2, name: 'Color Intro', difficulty: 'easy', stars: 2, isLocked: false },
      { id: 'c-e3', number: 3, name: 'Simple Stack', difficulty: 'easy', stars: 1, isLocked: false },
    ],
  },
  {
    title: 'Medium',
    difficulty: 'medium',
    levels: [
      { id: 'c-m1', number: 4, name: 'Grid Garden', difficulty: 'medium', stars: 3, isLocked: false },
      { id: 'c-m2', number: 5, name: 'Cross Pattern', difficulty: 'medium', stars: 0, isLocked: false },
      { id: 'c-m3', number: 6, name: 'Block Bridge', difficulty: 'medium', stars: 0, isLocked: false },
    ],
  },
  {
    title: 'Hard',
    difficulty: 'hard',
    levels: [
      { id: 'c-h1', number: 7, name: 'Lava Flow', difficulty: 'hard', stars: 0, isLocked: false },
      { id: 'c-h2', number: 8, name: 'Tight Squeeze', difficulty: 'hard', stars: 0, isLocked: true },
      { id: 'c-h3', number: 9, name: 'Mirror Maze', difficulty: 'hard', stars: 0, isLocked: true },
    ],
  },
  {
    title: 'Expert',
    difficulty: 'expert',
    levels: [
      { id: 'c-x1', number: 10, name: 'Gravity Well', difficulty: 'expert', stars: 0, isLocked: true },
      { id: 'c-x2', number: 11, name: 'Chaos Theory', difficulty: 'expert', stars: 0, isLocked: true },
      { id: 'c-x3', number: 12, name: 'Final Frontier', difficulty: 'expert', stars: 0, isLocked: true },
    ],
  },
];

// ---------------------------------------------------------------------------
// Stars component
// ---------------------------------------------------------------------------

function Stars({ count, max = 3 }: { count: number; max?: number }) {
  const stars: React.JSX.Element[] = [];
  for (let i = 0; i < max; i++) {
    const isFilled = i < count;
    stars.push(
      <Text
        key={i}
        style={[styles.star, isFilled ? styles.starFilled : styles.starEmpty]}
      >
        {'\u2605'}
      </Text>,
    );
  }
  return <View style={styles.starsRow}>{stars}</View>;
}

// ---------------------------------------------------------------------------
// Level card
// ---------------------------------------------------------------------------

interface LevelCardProps {
  level: CampaignLevel;
  onPress: (level: CampaignLevel) => void;
}

function LevelCard({ level, onPress }: LevelCardProps) {
  const diffColor = DIFFICULTY_COLORS[level.difficulty];
  const diffBg = DIFFICULTY_BG[level.difficulty];

  return (
    <TouchableOpacity
      style={[styles.levelCard, { borderColor: level.isLocked ? colors.ui.border : diffColor }]}
      activeOpacity={level.isLocked ? 1 : 0.7}
      onPress={() => !level.isLocked && onPress(level)}
    >
      {/* Card top area (number + color strip) */}
      <View style={[styles.levelCardTop, { backgroundColor: level.isLocked ? colors.bg.elevated : diffBg }]}>
        {level.isLocked ? (
          <Text style={styles.lockIcon}>{'\u{1F512}'}</Text>
        ) : (
          <Text style={[styles.levelNumber, { color: diffColor }]}>
            {level.number}
          </Text>
        )}
      </View>

      {/* Card bottom area */}
      <View style={styles.levelCardBottom}>
        <Text
          style={[styles.levelName, level.isLocked && styles.levelNameLocked]}
          numberOfLines={1}
        >
          {level.isLocked ? 'Locked' : level.name}
        </Text>
        {!level.isLocked && <Stars count={level.stars} />}
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Play Screen
// ---------------------------------------------------------------------------

type PlayNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function PlayScreen(): React.JSX.Element {
  const navigation = useNavigation<PlayNavProp>();

  const handlePressLevel = useCallback(
    (level: CampaignLevel) => {
      navigation.navigate('game/[levelId]', { levelId: level.id });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor={colors.bg.primary}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.header}>Campaign</Text>

        {/* Difficulty sections */}
        {CAMPAIGN_SECTIONS.map((section) => (
          <View key={section.difficulty} style={styles.section}>
            {/* Section header */}
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionDot,
                  { backgroundColor: DIFFICULTY_COLORS[section.difficulty] },
                ]}
              />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionLine} />
            </View>

            {/* Horizontal scroll of level cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.levelRow}
            >
              {section.levels.map((level) => (
                <LevelCard
                  key={level.id}
                  level={level}
                  onPress={handlePressLevel}
                />
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CARD_WIDTH = 130;
const CARD_TOP_HEIGHT = 80;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // -- Header ----------------------------------------------------------------
  header: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['2xl'],
    color: colors.ui.text,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  // -- Section ---------------------------------------------------------------
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    color: colors.ui.text,
    marginRight: spacing.md,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.ui.border,
  },

  // -- Level row (horizontal scroll) ----------------------------------------
  levelRow: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },

  // -- Level card ------------------------------------------------------------
  levelCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    overflow: 'hidden',
  },
  levelCardTop: {
    height: CARD_TOP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['2xl'],
  },
  lockIcon: {
    fontSize: typography.sizes.xl,
  },
  levelCardBottom: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  levelName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.ui.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  levelNameLocked: {
    color: colors.ui.textSoft,
  },

  // -- Stars -----------------------------------------------------------------
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: typography.sizes.base,
  },
  starFilled: {
    color: colors.ui.warning,
  },
  starEmpty: {
    color: colors.ui.border,
  },
});
