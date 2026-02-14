import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';
import { SCREEN_NAMES, STORAGE_KEYS } from '@/utils/constants';
import type { RootStackParamList } from '@/types/navigation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type OnboardingNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'auth/onboarding'
>;

// ---------------------------------------------------------------------------
// Page data
// ---------------------------------------------------------------------------

interface OnboardingPage {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}

const PAGES: OnboardingPage[] = [
  {
    id: 'play',
    icon: '\uD83E\uDDE9', // puzzle piece emoji
    iconColor: colors.blocks.blue,
    title: 'Play Puzzles',
    description:
      'Dive into thousands of hand-crafted block puzzles. Match colors, clear rows, and chase high scores across endless community-created levels.',
  },
  {
    id: 'create',
    icon: '\uD83C\uDFA8', // artist palette emoji
    iconColor: colors.blocks.green,
    title: 'Create Levels',
    description:
      'Unleash your creativity with the built-in level editor. Place blocks, set goals, and design puzzles that challenge players worldwide.',
  },
  {
    id: 'share',
    icon: '\uD83D\uDC65', // busts in silhouette emoji
    iconColor: colors.blocks.purple,
    title: 'Share & Compete',
    description:
      'Publish your creations to the community feed. Earn likes, climb the leaderboards, and discover levels from creators around the globe.',
  },
];

// ---------------------------------------------------------------------------
// Storage helper to mark onboarding complete
// ---------------------------------------------------------------------------

function markOnboardingComplete(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv');
    const storage = new MMKV();
    storage.set(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  } catch {
    // Swallow -- not critical.
  }
}

// ---------------------------------------------------------------------------
// Onboarding Screen
// ---------------------------------------------------------------------------

export default function OnboardingScreen(): React.JSX.Element {
  const navigation = useNavigation<OnboardingNavProp>();
  const flatListRef = useRef<FlatList<OnboardingPage>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track visible item through onScroll for snappy dot indicators.
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      if (index >= 0 && index < PAGES.length && index !== activeIndex) {
        setActiveIndex(index);
      }
    },
    [activeIndex],
  );

  // Navigate to main tabs and flag onboarding as done.
  const finishOnboarding = useCallback(() => {
    markOnboardingComplete();
    navigation.reset({ index: 0, routes: [{ name: SCREEN_NAMES.TABS }] });
  }, [navigation]);

  // "Next" button advances the pager; "Get Started" on last page finishes.
  const handleNext = useCallback(() => {
    if (activeIndex < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      finishOnboarding();
    }
  }, [activeIndex, finishOnboarding]);

  // Skip jumps straight to the main app.
  const handleSkip = useCallback(() => {
    finishOnboarding();
  }, [finishOnboarding]);

  // ---- Render a single onboarding page ----
  const renderPage = useCallback(
    ({ item }: ListRenderItemInfo<OnboardingPage>) => (
      <View style={styles.page}>
        <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '22' }]}>
          <Text style={styles.pageIcon}>{item.icon}</Text>
        </View>
        <Text style={styles.pageTitle}>{item.title}</Text>
        <Text style={styles.pageDescription}>{item.description}</Text>
      </View>
    ),
    [],
  );

  const isLastPage = activeIndex === PAGES.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ---- Skip button (top right) ---- */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={styles.skipButton}
          activeOpacity={0.7}
          onPress={handleSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* ---- Pager ---- */}
      <FlatList
        ref={flatListRef}
        data={PAGES}
        keyExtractor={(item) => item.id}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* ---- Bottom controls: dots + button ---- */}
      <View style={styles.bottomControls}>
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {PAGES.map((page, index) => (
            <View
              key={page.id}
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          style={styles.nextButton}
          activeOpacity={0.8}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isLastPage ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
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

  // -- Header / Skip ----------------------------------------------------------
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  headerSpacer: {
    flex: 1,
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.base,
    color: colors.ui.textSoft,
  },

  // -- Page -------------------------------------------------------------------
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  pageIcon: {
    fontSize: 56,
  },
  pageTitle: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['2xl'],
    color: colors.ui.text,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  pageDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    color: colors.ui.textSoft,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.base,
  },

  // -- Bottom controls --------------------------------------------------------
  bottomControls: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.ui.accent,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.ui.border,
  },
  nextButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.ui.accent,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.base,
    color: colors.ui.text,
  },
});
