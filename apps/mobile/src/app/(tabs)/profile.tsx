import React, { useCallback } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';
import { useUserStore } from '@/stores/useUserStore';

// ---------------------------------------------------------------------------
// Mock user data
// ---------------------------------------------------------------------------

const MOCK_USER = {
  id: 'user-001',
  firebaseUid: 'fb-001',
  displayName: 'BlockMaster',
  avatarUrl: null as string | null,
  coins: 1250,
  totalLikes: 892,
  levelsCreated: 14,
  levelsPlayed: 237,
  highScore: 48500,
  isPremium: false,
  createdAt: '2025-06-15T10:00:00Z',
  lastActiveAt: '2025-12-01T18:30:00Z',
};

interface UserLevel {
  id: string;
  name: string;
  difficulty: string;
  likesCount: number;
  playsCount: number;
  createdAt: string;
}

const MOCK_USER_LEVELS: UserLevel[] = [
  { id: 'ul-1', name: 'Neon Cascade', difficulty: 'easy', likesCount: 234, playsCount: 1820, createdAt: '2025-12-01' },
  { id: 'ul-2', name: 'Crystal Caves', difficulty: 'medium', likesCount: 145, playsCount: 980, createdAt: '2025-11-28' },
  { id: 'ul-3', name: 'Inferno Rush', difficulty: 'hard', likesCount: 276, playsCount: 1900, createdAt: '2025-11-20' },
  { id: 'ul-4', name: 'Zen Garden', difficulty: 'easy', likesCount: 321, playsCount: 2400, createdAt: '2025-11-15' },
  { id: 'ul-5', name: 'Pixel Panic', difficulty: 'expert', likesCount: 489, playsCount: 2800, createdAt: '2025-11-10' },
];

// ---------------------------------------------------------------------------
// Difficulty colour map
// ---------------------------------------------------------------------------

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: colors.ui.success,
  medium: colors.ui.warning,
  hard: colors.ui.error,
  expert: colors.blocks.purple,
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Settings button
// ---------------------------------------------------------------------------

interface SettingsButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
  isDestructive?: boolean;
}

function SettingsButton({ label, icon, onPress, isDestructive = false }: SettingsButtonProps) {
  return (
    <TouchableOpacity
      style={styles.settingsButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.settingsIcon}>{icon}</Text>
      <Text style={[styles.settingsLabel, isDestructive && styles.settingsLabelDestructive]}>
        {label}
      </Text>
      <Text style={styles.settingsChevron}>{'\u203A'}</Text>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Profile Screen
// ---------------------------------------------------------------------------

export default function ProfileScreen(): React.JSX.Element {
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);

  // Use mock data if no user is signed in
  const displayUser = user ?? MOCK_USER;
  const initials = displayUser.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // -- Handlers ---------------------------------------------------------------

  const handleRemoveAds = useCallback(() => {
    Alert.alert('Remove Ads', 'Premium upgrade coming soon!');
  }, []);

  const handleRateApp = useCallback(() => {
    // In production, link to the app store listing
    Alert.alert('Rate App', 'Thank you for your support!');
  }, []);

  const handlePrivacyPolicy = useCallback(() => {
    Linking.openURL('https://blockjam.app/privacy');
  }, []);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  }, [logout]);

  // -- Render user level item -------------------------------------------------

  const renderUserLevel = useCallback(
    ({ item }: { item: UserLevel }) => {
      const diffColor = DIFFICULTY_COLORS[item.difficulty] ?? colors.ui.accent;
      return (
        <View style={styles.levelItem}>
          <View style={[styles.levelDot, { backgroundColor: diffColor }]} />
          <View style={styles.levelItemBody}>
            <Text style={styles.levelItemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.levelItemMeta}>
              {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
              {'  \u2022  '}
              {'\u2665'} {item.likesCount}
              {'  \u2022  '}
              {'\u25B6'} {item.playsCount}
            </Text>
          </View>
        </View>
      );
    },
    [],
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
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{displayUser.displayName}</Text>
          {displayUser.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>

        {/* Stats grid (2x2) */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Levels Created"
              value={displayUser.levelsCreated}
              icon={'\u2295'} // circled plus
            />
            <StatCard
              label="Levels Played"
              value={displayUser.levelsPlayed}
              icon={'\u25B6'} // play
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Total Likes"
              value={displayUser.totalLikes}
              icon={'\u2665'} // heart
            />
            <StatCard
              label="High Score"
              value={displayUser.highScore}
              icon={'\u2605'} // star
            />
          </View>
        </View>

        {/* My Levels */}
        <Text style={styles.sectionTitle}>My Levels</Text>
        <View style={styles.myLevelsList}>
          <FlatList
            data={MOCK_USER_LEVELS}
            keyExtractor={(item) => item.id}
            renderItem={renderUserLevel}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.levelSeparator} />}
            ListEmptyComponent={
              <View style={styles.emptyLevels}>
                <Text style={styles.emptyText}>No levels created yet</Text>
              </View>
            }
          />
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsCard}>
          <SettingsButton
            label="Remove Ads"
            icon={'\u2716'} // X
            onPress={handleRemoveAds}
          />
          <View style={styles.settingsDivider} />
          <SettingsButton
            label="Rate App"
            icon={'\u2605'} // star
            onPress={handleRateApp}
          />
          <View style={styles.settingsDivider} />
          <SettingsButton
            label="Privacy Policy"
            icon={'\u{1F512}'} // lock
            onPress={handlePrivacyPolicy}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 120,
  },

  // -- Avatar section --------------------------------------------------------
  avatarSection: {
    alignItems: 'center',
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.ui.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarInitials: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['2xl'],
    color: colors.ui.text,
  },
  displayName: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes.xl,
    color: colors.ui.text,
    marginBottom: spacing.xs,
  },
  premiumBadge: {
    backgroundColor: colors.blocks.yellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  premiumText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xs,
    color: colors.bg.primary,
    letterSpacing: 1,
  },

  // -- Stats grid (2x2) -----------------------------------------------------
  statsGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: typography.sizes.lg,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes.xl,
    color: colors.ui.text,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: colors.ui.textSoft,
    textAlign: 'center',
  },

  // -- Section title ---------------------------------------------------------
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    color: colors.ui.text,
    marginBottom: spacing.md,
  },

  // -- My Levels list --------------------------------------------------------
  myLevelsList: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.md,
  },
  levelItemBody: {
    flex: 1,
  },
  levelItemName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.base,
    color: colors.ui.text,
    marginBottom: 2,
  },
  levelItemMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: colors.ui.textSoft,
  },
  levelSeparator: {
    height: 1,
    backgroundColor: colors.ui.border,
    marginHorizontal: spacing.base,
  },
  emptyLevels: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.ui.textSoft,
  },

  // -- Settings card ---------------------------------------------------------
  settingsCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
  },
  settingsIcon: {
    fontSize: typography.sizes.lg,
    width: 32,
    textAlign: 'center',
    marginRight: spacing.md,
  },
  settingsLabel: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.base,
    color: colors.ui.text,
  },
  settingsLabelDestructive: {
    color: colors.ui.error,
  },
  settingsChevron: {
    fontSize: typography.sizes.xl,
    color: colors.ui.textSoft,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: colors.ui.border,
    marginHorizontal: spacing.base,
  },

  // -- Logout button ---------------------------------------------------------
  logoutButton: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.ui.error,
    paddingVertical: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  logoutText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.base,
    color: colors.ui.error,
  },
});
