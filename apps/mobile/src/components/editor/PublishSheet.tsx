import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublishSheetProps {
  /** Whether the sheet is visible. */
  visible: boolean;
  /** Callback to confirm publishing. */
  onPublish: () => void;
  /** Callback to dismiss the sheet. */
  onClose: () => void;
  /** Level name to display in the summary. */
  levelName: string;
  /** Difficulty label to display in the summary. */
  difficulty: string;
  /** Grid dimension (e.g. 8 for 8x8). */
  gridSize: number;
}

// ---------------------------------------------------------------------------
// Difficulty badge colour helper
// ---------------------------------------------------------------------------

const DIFFICULTY_BADGE_COLORS: Record<string, string> = {
  easy: colors.blocks.green,
  medium: colors.blocks.yellow,
  hard: colors.blocks.orange,
  expert: colors.blocks.red,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PublishSheet: React.FC<PublishSheetProps> = ({
  visible,
  onPublish,
  onClose,
  levelName,
  difficulty,
  gridSize,
}) => {
  const badgeColor =
    DIFFICULTY_BADGE_COLORS[difficulty.toLowerCase()] ?? colors.ui.accent;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Semi-transparent overlay */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Prevent taps on the sheet body from closing */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Handle bar */}
          <View style={styles.handleBarWrapper}>
            <View style={styles.handleBar} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Publish Level</Text>

          {/* Level summary */}
          <View style={styles.summaryCard}>
            {/* Name */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Name</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {levelName || 'Untitled'}
              </Text>
            </View>

            {/* Difficulty badge */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Difficulty</Text>
              <View
                style={[styles.difficultyBadge, { backgroundColor: badgeColor }]}
              >
                <Text style={styles.difficultyBadgeText}>
                  {difficulty.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Grid size */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Grid Size</Text>
              <Text style={styles.summaryValue}>
                {gridSize}x{gridSize}
              </Text>
            </View>
          </View>

          {/* Warning */}
          <Text style={styles.warningText}>
            Your level will be publicly visible to the entire BlockJam community
            once published.
          </Text>

          {/* Publish button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPublish}
            style={styles.publishButton}
          >
            <Text style={styles.publishButtonText}>
              Publish to Community
            </Text>
          </TouchableOpacity>

          {/* Cancel button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  handleBarWrapper: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bg.elevated,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ui.text,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },

  // -- Summary card ----------------------------------------------------------
  summaryCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ui.textSoft,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ui.text,
    flexShrink: 1,
    textAlign: 'right',
  },

  // -- Difficulty badge ------------------------------------------------------
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  difficultyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ui.text,
    letterSpacing: 0.5,
  },

  // -- Warning ---------------------------------------------------------------
  warningText: {
    fontSize: 13,
    color: colors.ui.textSoft,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  // -- Buttons ---------------------------------------------------------------
  publishButton: {
    backgroundColor: colors.ui.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  publishButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ui.text,
    letterSpacing: 0.3,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ui.textSoft,
  },
});

export default React.memo(PublishSheet);
