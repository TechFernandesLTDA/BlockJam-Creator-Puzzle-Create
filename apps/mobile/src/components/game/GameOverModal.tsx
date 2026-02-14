import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GameOverModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** The player's final score. */
  score: number;
  /** Whether the player won (level complete) or lost (game over). */
  isWin: boolean;
  /** Restart the current level from scratch. */
  onRestart: () => void;
  /** Watch a rewarded ad to continue playing. */
  onWatchAd: () => void;
  /** Exit back to the previous screen. */
  onExit: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a 1-3 star rating based on score tiers.
 * This is a simple UI-only heuristic; the real star rating comes from
 * ScoreCalculator / the game store.
 */
function getStarRating(score: number, isWin: boolean): number {
  if (!isWin) return 0;
  if (score >= 5000) return 3;
  if (score >= 2000) return 2;
  return 1;
}

/**
 * Renders a row of star characters with filled/empty styling.
 */
function StarDisplay({ rating }: { rating: number }): React.JSX.Element {
  const stars: React.JSX.Element[] = [];
  for (let i = 1; i <= 3; i++) {
    const filled = i <= rating;
    stars.push(
      <Text
        key={`star-${i}`}
        style={[styles.star, filled ? styles.starFilled : styles.starEmpty]}
      >
        {'\u2605'}
      </Text>,
    );
  }
  return <View style={styles.starsRow}>{stars}</View>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  score,
  isWin,
  onRestart,
  onWatchAd,
  onExit,
}) => {
  const starRating = getStarRating(score, isWin);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Title */}
          <Text style={[styles.title, isWin ? styles.titleWin : styles.titleLose]}>
            {isWin ? 'Level Complete!' : 'Game Over'}
          </Text>

          {/* Stars */}
          <StarDisplay rating={starRating} />

          {/* Score */}
          <Text style={styles.scoreLabel}>FINAL SCORE</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Watch Ad to Continue -- only on game over (not win) */}
            {!isWin && (
              <TouchableOpacity
                style={[styles.button, styles.adButton]}
                activeOpacity={0.8}
                onPress={onWatchAd}
              >
                <Text style={styles.adButtonText}>
                  {'\u25B6'} Watch Ad to Continue
                </Text>
              </TouchableOpacity>
            )}

            {/* Restart */}
            <TouchableOpacity
              style={[styles.button, styles.restartButton]}
              activeOpacity={0.8}
              onPress={onRestart}
            >
              <Text style={styles.restartButtonText}>Restart</Text>
            </TouchableOpacity>

            {/* Exit */}
            <TouchableOpacity
              style={[styles.button, styles.exitButton]}
              activeOpacity={0.8}
              onPress={onExit}
            >
              <Text style={styles.exitButtonText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.bg.secondary,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border,
    // Soft card shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['3xl'],
    textAlign: 'center',
    marginBottom: 12,
  },
  titleWin: {
    color: colors.ui.success,
  },
  titleLose: {
    color: colors.ui.error,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  star: {
    fontSize: 40,
  },
  starFilled: {
    color: colors.blocks.yellow,
    textShadowColor: colors.blocks.orange,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  starEmpty: {
    color: colors.ui.border,
  },
  scoreLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.xs,
    color: colors.ui.textSoft,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  scoreValue: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['4xl'],
    color: colors.ui.text,
    marginBottom: 28,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adButton: {
    backgroundColor: colors.blocks.yellow,
    shadowColor: colors.blocks.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  adButtonText: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes.md,
    color: colors.bg.primary,
  },
  restartButton: {
    backgroundColor: colors.ui.accent,
  },
  restartButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
    color: colors.ui.text,
  },
  exitButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  exitButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.md,
    color: colors.ui.textSoft,
  },
});

export default React.memo(GameOverModal);
