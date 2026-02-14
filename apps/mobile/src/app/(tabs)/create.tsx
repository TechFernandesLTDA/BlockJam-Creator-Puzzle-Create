import React, { useCallback, useMemo } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// LinearGradient removed — using solid accent bg fallback.
// Install react-native-linear-gradient and re-enable for gradient buttons.

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing, borderRadius } from '@/theme/spacing';
import { useEditorStore } from '@/stores/useEditorStore';
import type { BlockColor, Difficulty, GridSize } from '@blockjam/shared';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = spacing.base * 2; // left + right padding
const MAX_GRID_WIDTH = SCREEN_WIDTH - GRID_PADDING;

const GRID_SIZE_OPTIONS: GridSize[] = [6, 8, 10];

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty }[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
  { label: 'Expert', value: 'expert' },
];

const PALETTE_COLORS: { name: BlockColor; hex: string }[] = [
  { name: 'red', hex: colors.blocks.red },
  { name: 'blue', hex: colors.blocks.blue },
  { name: 'green', hex: colors.blocks.green },
  { name: 'yellow', hex: colors.blocks.yellow },
  { name: 'purple', hex: colors.blocks.purple },
  { name: 'orange', hex: colors.blocks.orange },
  { name: 'cyan', hex: colors.blocks.cyan },
  { name: 'pink', hex: colors.blocks.pink },
];

type EditorTool = 'paint' | 'erase' | 'fill';

const TOOL_OPTIONS: { label: string; value: EditorTool; icon: string }[] = [
  { label: 'Paint', value: 'paint', icon: '\u270F' }, // pencil
  { label: 'Erase', value: 'erase', icon: '\u2716' }, // X
  { label: 'Fill', value: 'fill', icon: '\u25A3' },   // filled square
];

// ---------------------------------------------------------------------------
// Block colour to hex helper
// ---------------------------------------------------------------------------

const BLOCK_COLOR_MAP: Record<BlockColor, string> = {
  red: colors.blocks.red,
  blue: colors.blocks.blue,
  green: colors.blocks.green,
  yellow: colors.blocks.yellow,
  purple: colors.blocks.purple,
  orange: colors.blocks.orange,
  cyan: colors.blocks.cyan,
  pink: colors.blocks.pink,
};

// ---------------------------------------------------------------------------
// Difficulty colour map
// ---------------------------------------------------------------------------

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: colors.ui.success,
  medium: colors.ui.warning,
  hard: colors.ui.error,
  expert: colors.blocks.purple,
};

// ---------------------------------------------------------------------------
// Gradient Button component (inline until @/components/ui/GradientButton exists)
// ---------------------------------------------------------------------------

function GradientButton({
  label,
  onPress,
  gradient = colors.gradients.primary,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  gradient?: readonly [string, string];
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[styles.gradientButtonOuter, disabled && styles.gradientButtonDisabled]}
    >
      <View style={[styles.gradientButtonInner, { backgroundColor: colors.ui.accent }]}>
        <Text style={styles.gradientButtonText}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Editor Canvas
// ---------------------------------------------------------------------------

interface EditorCanvasProps {
  grid: (BlockColor | null)[][];
  gridSize: GridSize;
  onCellPress: (row: number, col: number) => void;
}

function EditorCanvas({ grid, gridSize, onCellPress }: EditorCanvasProps) {
  const cellSize = Math.floor(MAX_GRID_WIDTH / gridSize);
  const totalGridWidth = cellSize * gridSize;

  const cells = useMemo(() => {
    const result: React.JSX.Element[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cellColor = grid[r]?.[c];
        const bgColor = cellColor ? BLOCK_COLOR_MAP[cellColor] : colors.bg.elevated;

        result.push(
          <TouchableOpacity
            key={`${r}-${c}`}
            style={[
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                backgroundColor: bgColor,
              },
            ]}
            activeOpacity={0.6}
            onPress={() => onCellPress(r, c)}
          />,
        );
      }
    }
    return result;
  }, [grid, gridSize, cellSize, onCellPress]);

  return (
    <View
      style={[
        styles.canvasContainer,
        { width: totalGridWidth, height: totalGridWidth },
      ]}
    >
      {cells}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Create Screen
// ---------------------------------------------------------------------------

export default function CreateScreen(): React.JSX.Element {
  const grid = useEditorStore((s) => s.grid);
  const gridSize = useEditorStore((s) => s.gridSize);
  const selectedColor = useEditorStore((s) => s.selectedColor);
  const selectedTool = useEditorStore((s) => s.selectedTool);
  const levelName = useEditorStore((s) => s.levelName);
  const difficulty = useEditorStore((s) => s.difficulty);
  const targetLines = useEditorStore((s) => s.targetLines);
  const maxMoves = useEditorStore((s) => s.maxMoves);

  const initEditor = useEditorStore((s) => s.initEditor);
  const setCell = useEditorStore((s) => s.setCell);
  const setTool = useEditorStore((s) => s.setTool);
  const setColor = useEditorStore((s) => s.setColor);
  const setLevelMeta = useEditorStore((s) => s.setLevelMeta);

  // -- Handlers ---------------------------------------------------------------

  const handleGridSizeChange = useCallback(
    (size: GridSize) => {
      if (size === gridSize) return;
      initEditor(size);
    },
    [gridSize, initEditor],
  );

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      setCell(row, col);
    },
    [setCell],
  );

  const handleToolChange = useCallback(
    (tool: EditorTool) => {
      setTool(tool);
    },
    [setTool],
  );

  const handleColorChange = useCallback(
    (color: BlockColor) => {
      setColor(color);
      // Switch to paint tool when selecting a colour
      if (selectedTool === 'erase') {
        setTool('paint');
      }
    },
    [setColor, setTool, selectedTool],
  );

  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      setLevelMeta({ difficulty: diff });
    },
    [setLevelMeta],
  );

  const handleTestPlay = useCallback(() => {
    // TODO: navigate to a test play session with the current grid
  }, []);

  const handlePublish = useCallback(() => {
    // TODO: validate and publish the level
  }, []);

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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.header}>Create Level</Text>

        {/* Grid size selector */}
        <Text style={styles.sectionLabel}>Grid Size</Text>
        <View style={styles.segmentedControl}>
          {GRID_SIZE_OPTIONS.map((size) => {
            const isActive = gridSize === size;
            return (
              <TouchableOpacity
                key={size}
                style={[
                  styles.segmentButton,
                  isActive && styles.segmentButtonActive,
                ]}
                onPress={() => handleGridSizeChange(size)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isActive && styles.segmentTextActive,
                  ]}
                >
                  {size}x{size}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tool bar */}
        <Text style={styles.sectionLabel}>Tool</Text>
        <View style={styles.toolBar}>
          {TOOL_OPTIONS.map((tool) => {
            const isActive = selectedTool === tool.value;
            return (
              <TouchableOpacity
                key={tool.value}
                style={[
                  styles.toolButton,
                  isActive && styles.toolButtonActive,
                ]}
                onPress={() => handleToolChange(tool.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.toolIcon}>{tool.icon}</Text>
                <Text
                  style={[
                    styles.toolLabel,
                    isActive && styles.toolLabelActive,
                  ]}
                >
                  {tool.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Editor canvas */}
        <View style={styles.canvasWrapper}>
          <EditorCanvas
            grid={grid}
            gridSize={gridSize}
            onCellPress={handleCellPress}
          />
        </View>

        {/* Colour palette */}
        <Text style={styles.sectionLabel}>Color Palette</Text>
        <View style={styles.paletteBar}>
          {PALETTE_COLORS.map((item) => {
            const isActive = selectedColor === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.paletteCircle,
                  { backgroundColor: item.hex },
                  isActive && styles.paletteCircleActive,
                ]}
                onPress={() => handleColorChange(item.name)}
                activeOpacity={0.7}
              />
            );
          })}
        </View>

        {/* Level name input */}
        <Text style={styles.sectionLabel}>Level Name</Text>
        <TextInput
          style={styles.textInput}
          value={levelName}
          onChangeText={(text) => setLevelMeta({ levelName: text })}
          placeholder="Enter level name..."
          placeholderTextColor={colors.ui.textSoft}
          maxLength={40}
        />

        {/* Difficulty selector */}
        <Text style={styles.sectionLabel}>Difficulty</Text>
        <View style={styles.difficultyRow}>
          {DIFFICULTY_OPTIONS.map((opt) => {
            const isActive = difficulty === opt.value;
            const diffColor = DIFFICULTY_COLORS[opt.value];
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.difficultyPill,
                  {
                    borderColor: isActive ? diffColor : colors.ui.border,
                    backgroundColor: isActive ? `${diffColor}20` : colors.bg.surface,
                  },
                ]}
                onPress={() => handleDifficultyChange(opt.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.difficultyPillText,
                    { color: isActive ? diffColor : colors.ui.textSoft },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Target lines and max moves */}
        <View style={styles.numberInputRow}>
          <View style={styles.numberInputGroup}>
            <Text style={styles.sectionLabel}>Target Lines</Text>
            <TextInput
              style={styles.numberInput}
              value={String(targetLines)}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (!isNaN(num) && num >= 0) {
                  setLevelMeta({ targetLines: num });
                } else if (text === '') {
                  setLevelMeta({ targetLines: 0 });
                }
              }}
              keyboardType="number-pad"
              maxLength={3}
              placeholderTextColor={colors.ui.textSoft}
            />
          </View>
          <View style={styles.numberInputGroup}>
            <Text style={styles.sectionLabel}>Max Moves</Text>
            <TextInput
              style={styles.numberInput}
              value={String(maxMoves)}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (!isNaN(num) && num >= 0) {
                  setLevelMeta({ maxMoves: num });
                } else if (text === '') {
                  setLevelMeta({ maxMoves: 0 });
                }
              }}
              keyboardType="number-pad"
              maxLength={3}
              placeholderTextColor={colors.ui.textSoft}
            />
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.testPlayButton}
            onPress={handleTestPlay}
            activeOpacity={0.7}
          >
            <Text style={styles.testPlayIcon}>{'\u25B6'}</Text>
            <Text style={styles.testPlayText}>Test Play</Text>
          </TouchableOpacity>

          <View style={styles.publishButtonWrapper}>
            <GradientButton
              label="Publish"
              onPress={handlePublish}
              gradient={colors.gradients.primary}
              disabled={levelName.trim().length === 0}
            />
          </View>
        </View>
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

  // -- Header ----------------------------------------------------------------
  header: {
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.sizes['2xl'],
    color: colors.ui.text,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  // -- Section label ---------------------------------------------------------
  sectionLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.ui.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.base,
  },

  // -- Segmented control (grid size) ----------------------------------------
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.ui.border,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.ui.accent,
  },
  segmentText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.base,
    color: colors.ui.textSoft,
  },
  segmentTextActive: {
    color: colors.ui.text,
  },

  // -- Tool bar --------------------------------------------------------------
  toolBar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toolButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.ui.border,
    gap: spacing.xs,
  },
  toolButtonActive: {
    backgroundColor: colors.ui.accent,
    borderColor: colors.ui.accent,
  },
  toolIcon: {
    fontSize: typography.sizes.base,
    color: colors.ui.text,
  },
  toolLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.ui.textSoft,
  },
  toolLabelActive: {
    color: colors.ui.text,
  },

  // -- Canvas ----------------------------------------------------------------
  canvasWrapper: {
    alignItems: 'center',
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  canvasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.ui.border,
    overflow: 'hidden',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: colors.ui.border,
  },

  // -- Colour palette --------------------------------------------------------
  paletteBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  paletteCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paletteCircleActive: {
    borderColor: colors.ui.text,
    shadowColor: colors.ui.text,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },

  // -- Text input ------------------------------------------------------------
  textInput: {
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.ui.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    color: colors.ui.text,
  },

  // -- Difficulty selector ---------------------------------------------------
  difficultyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  difficultyPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyPillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
  },

  // -- Number inputs ---------------------------------------------------------
  numberInputRow: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  numberInputGroup: {
    flex: 1,
  },
  numberInput: {
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.ui.border,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    color: colors.ui.text,
    textAlign: 'center',
  },

  // -- Action buttons --------------------------------------------------------
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  testPlayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    backgroundColor: colors.bg.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    gap: spacing.sm,
  },
  testPlayIcon: {
    fontSize: typography.sizes.base,
    color: colors.ui.accent,
  },
  testPlayText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.base,
    color: colors.ui.text,
  },
  publishButtonWrapper: {
    flex: 1,
  },

  // -- Gradient button -------------------------------------------------------
  gradientButtonOuter: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  gradientButtonDisabled: {
    opacity: 0.5,
  },
  gradientButtonInner: {
    paddingVertical: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  gradientButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.base,
    color: colors.ui.text,
  },
});
