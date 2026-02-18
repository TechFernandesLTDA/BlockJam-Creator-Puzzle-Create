import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

import GameBoard from '@/components/game/GameBoard';
import BlockPiece from '@/components/game/BlockPiece';
import ScoreBar from '@/components/game/ScoreBar';
import GameOverModal from '@/components/game/GameOverModal';
import ComboEffect from '@/components/game/ComboEffect';
import TutorialOverlay from '@/components/game/TutorialOverlay';
import TipBubble from '@/components/game/TipBubble';
import HintButton from '@/components/game/HintButton';

import { useGameStore } from '@/stores/useGameStore';
import { useTutorialStore } from '@/stores/useTutorialStore';
import { canPlacePiece } from '@/engine/GridLogic';

// ---------------------------------------------------------------------------
// Colour mapping utility
// ---------------------------------------------------------------------------

const blockColorToHex: Record<string, string> = {
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
// Screen
// ---------------------------------------------------------------------------

export default function GameLevelScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const levelId: string = route.params?.levelId ?? 'endless';

  // ---- Store selectors ----------------------------------------------------
  const grid = useGameStore((s) => s.grid);
  const gridSize = useGameStore((s) => s.gridSize);
  const currentPieces = useGameStore((s) => s.currentPieces);
  const selectedPieceIndex = useGameStore((s) => s.selectedPieceIndex);
  const score = useGameStore((s) => s.score);
  const combo = useGameStore((s) => s.combo);
  const movesLeft = useGameStore((s) => s.movesLeft);
  const linesCleared = useGameStore((s) => s.linesCleared);
  const targetLines = useGameStore((s) => s.targetLines);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isLevelComplete = useGameStore((s) => s.isLevelComplete);

  const initGame = useGameStore((s) => s.initGame);
  const selectPiece = useGameStore((s) => s.selectPiece);
  const placePiece = useGameStore((s) => s.placePiece);
  const resetGame = useGameStore((s) => s.resetGame);
  const continueAfterGameOver = useGameStore((s) => s.continueAfterGameOver);

  // ---- Tutorial store selectors -------------------------------------------
  const tutorialStep = useTutorialStore((s) => s.tutorialStep);
  const activeTip = useTutorialStore((s) => s.activeTip);
  const hintCells = useTutorialStore((s) => s.hintCells);
  const startTutorial = useTutorialStore((s) => s.startTutorial);
  const nextStep = useTutorialStore((s) => s.nextStep);
  const showTip = useTutorialStore((s) => s.showTip);
  const dismissTip = useTutorialStore((s) => s.dismissTip);

  // ---- Local UI state -----------------------------------------------------
  const [showCombo, setShowCombo] = useState(false);
  const [displayedCombo, setDisplayedCombo] = useState(0);

  // Track previous values for tip triggers
  const prevSelectedRef = useRef<number | null>(null);
  const prevLinesClearedRef = useRef(0);
  const prevComboRef = useRef(0);

  // ---- Initialise game on mount -------------------------------------------
  useEffect(() => {
    initGame(8);
    startTutorial();
    return () => {
      resetGame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Show combo effect when combo changes -------------------------------
  useEffect(() => {
    if (combo > 1) {
      setDisplayedCombo(combo);
      setShowCombo(true);

      const timer = setTimeout(() => {
        setShowCombo(false);
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, [combo]);

  // ---- Tutorial: advance step on piece selection (step 1 → 2) -------------
  useEffect(() => {
    if (
      tutorialStep === 1 &&
      selectedPieceIndex !== null &&
      prevSelectedRef.current === null
    ) {
      nextStep();
    }
    prevSelectedRef.current = selectedPieceIndex;
  }, [selectedPieceIndex, tutorialStep, nextStep]);

  // ---- Tutorial: advance step on piece placement (step 2 → 3) -------------
  useEffect(() => {
    // When the grid changes after step 2 (piece was placed), selectedPieceIndex
    // goes back to null. We detect placement by selectedPieceIndex going
    // from non-null → null while tutorialStep is 2.
    if (
      tutorialStep === 2 &&
      selectedPieceIndex === null &&
      prevSelectedRef.current !== null
    ) {
      nextStep();
    }
  }, [selectedPieceIndex, tutorialStep, nextStep]);

  // ---- Contextual tip: first_select --------------------------------------
  useEffect(() => {
    if (
      tutorialStep === null &&
      selectedPieceIndex !== null &&
      prevSelectedRef.current === null
    ) {
      showTip(
        'first_select',
        'Você selecionou uma peça! Toque no tabuleiro para colocá-la.',
      );
    }
    // prevSelectedRef is updated in the tutorial effect above
  }, [selectedPieceIndex, tutorialStep, showTip]);

  // ---- Contextual tip: first_clear ---------------------------------------
  useEffect(() => {
    if (
      tutorialStep === null &&
      linesCleared > prevLinesClearedRef.current
    ) {
      showTip(
        'first_clear',
        'Linha limpa! Continue limpando para ganhar mais pontos.',
      );
    }
    prevLinesClearedRef.current = linesCleared;
  }, [linesCleared, tutorialStep, showTip]);

  // ---- Contextual tip: combo_explain -------------------------------------
  useEffect(() => {
    if (tutorialStep === null && combo >= 3 && prevComboRef.current < 3) {
      showTip(
        'combo_explain',
        'Combo x3! Limpe linhas consecutivas para multiplicar sua pontuação.',
      );
    }
    prevComboRef.current = combo;
  }, [combo, tutorialStep, showTip]);

  // ---- Contextual tip: near_gameover -------------------------------------
  useEffect(() => {
    if (tutorialStep !== null) return;
    if (selectedPieceIndex === null) return;

    // Count valid positions for all unplaced pieces
    const unplaced = currentPieces.filter((p) => !p.isPlaced);
    let validPositions = 0;
    for (const piece of unplaced) {
      const shapeRows = piece.shape.length;
      const shapeCols = piece.shape[0]?.length ?? 0;
      for (let r = 0; r <= gridSize - shapeRows; r++) {
        for (let c = 0; c <= gridSize - shapeCols; c++) {
          if (canPlacePiece(grid, piece.shape, r, c)) {
            validPositions++;
            if (validPositions >= 3) break;
          }
        }
        if (validPositions >= 3) break;
      }
      if (validPositions >= 3) break;
    }

    if (validPositions < 3 && validPositions > 0) {
      showTip(
        'near_gameover',
        'Cuidado! Restam poucos espaços. Pense com cuidado.',
      );
    }
  }, [grid, currentPieces, selectedPieceIndex, gridSize, tutorialStep, showTip]);

  // ---- Compute highlight cells for valid placement preview ----------------
  const highlightCells = useMemo(() => {
    // If hint cells are active, use those instead
    if (hintCells) return hintCells;

    if (selectedPieceIndex === null) return undefined;

    const piece = currentPieces[selectedPieceIndex];
    if (!piece || piece.isPlaced) return undefined;

    const cells: { row: number; col: number }[] = [];
    const shape = piece.shape;
    const shapeRows = shape.length;
    const shapeCols = shape[0]?.length ?? 0;

    for (let r = 0; r <= gridSize - shapeRows; r++) {
      for (let c = 0; c <= gridSize - shapeCols; c++) {
        if (canPlacePiece(grid, shape, r, c)) {
          // Add the top-left anchor of each valid position
          for (let sr = 0; sr < shapeRows; sr++) {
            for (let sc = 0; sc < shapeCols; sc++) {
              if (shape[sr]![sc]) {
                cells.push({ row: r + sr, col: c + sc });
              }
            }
          }
        }
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return cells.filter((cell) => {
      const key = `${cell.row}-${cell.col}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedPieceIndex, currentPieces, grid, gridSize, hintCells]);

  // ---- Handlers -----------------------------------------------------------

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (selectedPieceIndex === null) return;
      placePiece(selectedPieceIndex, row, col);
    },
    [selectedPieceIndex, placePiece],
  );

  const handlePiecePress = useCallback(
    (index: number) => {
      if (selectedPieceIndex === index) {
        selectPiece(null); // deselect
      } else {
        selectPiece(index);
      }
    },
    [selectedPieceIndex, selectPiece],
  );

  const handleRestart = useCallback(() => {
    initGame(8);
  }, [initGame]);

  const handleWatchAd = useCallback(() => {
    // In production this would trigger a rewarded ad.
    // For now, just continue the game.
    continueAfterGameOver();
  }, [continueAfterGameOver]);

  const handleExit = useCallback(() => {
    resetGame();
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [resetGame, navigation]);

  // ---- Render -------------------------------------------------------------

  const isTutorialActive = tutorialStep !== null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* Header bar with back button and hint button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={handleExit}
          >
            <Text style={styles.backButtonText}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {levelId === 'endless' ? 'Endless Mode' : `Level ${levelId}`}
          </Text>
          <HintButton disabled={isTutorialActive} />
        </View>

        {/* Score Bar */}
        <ScoreBar
          score={score}
          combo={combo}
          movesLeft={movesLeft}
          linesCleared={linesCleared}
          targetLines={targetLines}
        />

        {/* Game Board */}
        <View style={styles.boardWrapper}>
          <GameBoard
            grid={grid}
            gridSize={gridSize}
            onCellPress={handleCellPress}
            highlightCells={highlightCells}
          />
        </View>

        {/* Piece tray */}
        <View style={styles.pieceTray}>
          {currentPieces.map((piece, index) => (
            <BlockPiece
              key={`piece-${index}-${piece.id}`}
              shape={piece.shape}
              color={blockColorToHex[piece.color] ?? colors.blocks.blue}
              isPlaced={piece.isPlaced}
              isSelected={selectedPieceIndex === index}
              onPress={() => handlePiecePress(index)}
            />
          ))}
        </View>

        {/* Combo Effect overlay */}
        <ComboEffect combo={displayedCombo} visible={showCombo} />

        {/* Tip Bubble */}
        <TipBubble
          message={activeTip?.message ?? ''}
          visible={activeTip !== null}
          onDismiss={dismissTip}
        />

        {/* Tutorial Overlay */}
        <TutorialOverlay />

        {/* Game Over / Level Complete modal */}
        <GameOverModal
          visible={isGameOver || isLevelComplete}
          score={score}
          isWin={isLevelComplete}
          onRestart={handleRestart}
          onWatchAd={handleWatchAd}
          onExit={handleExit}
        />
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  backButtonText: {
    fontSize: 22,
    color: colors.ui.text,
  },
  headerTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    color: colors.ui.text,
    textAlign: 'center',
  },
  boardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  pieceTray: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: colors.bg.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.ui.border,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
