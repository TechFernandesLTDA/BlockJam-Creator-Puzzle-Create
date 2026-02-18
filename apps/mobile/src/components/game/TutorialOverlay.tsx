import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useTutorialStore, TUTORIAL_TOTAL_STEPS } from '@/stores/useTutorialStore';

// ---------------------------------------------------------------------------
// Tutorial step definitions
// ---------------------------------------------------------------------------

interface StepDef {
  /** Instruction text shown to the player. */
  text: string;
  /** Where to render the instruction card relative to the spotlight. */
  cardPosition: 'bottom' | 'top';
  /** Whether the step has a manual "Next" button (vs waiting for an action). */
  hasNextButton: boolean;
}

const STEPS: StepDef[] = [
  {
    text: 'Bem-vindo ao BlockJam! Este é o tabuleiro. Seu objetivo é preencher linhas inteiras para limpá-las.',
    cardPosition: 'bottom',
    hasNextButton: true,
  },
  {
    text: 'Estas são suas peças. Toque em uma para selecioná-la.',
    cardPosition: 'top',
    hasNextButton: false, // waits for piece selection
  },
  {
    text: 'Ótimo! Agora toque em uma célula do tabuleiro para colocar a peça.',
    cardPosition: 'bottom',
    hasNextButton: false, // waits for placement
  },
  {
    text: 'Perfeito! Quando uma linha inteira é preenchida, ela é limpa automaticamente.',
    cardPosition: 'bottom',
    hasNextButton: true,
  },
  {
    text: 'Aqui você acompanha sua pontuação e combos. Boa sorte!',
    cardPosition: 'bottom',
    hasNextButton: true,
  },
];

// ---------------------------------------------------------------------------
// Spotlight regions — approximate positions for each step
// ---------------------------------------------------------------------------

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/**
 * Returns the "spotlight" rectangle for each tutorial step.
 * These are approximate layout-relative regions.
 */
function getSpotlight(step: number): {
  top: number;
  left: number;
  width: number;
  height: number;
} {
  switch (step) {
    case 0: // board
      return { top: SCREEN_H * 0.18, left: 8, width: SCREEN_W - 16, height: SCREEN_W - 16 };
    case 1: // piece tray
      return { top: SCREEN_H * 0.78, left: 0, width: SCREEN_W, height: SCREEN_H * 0.14 };
    case 2: // board (waiting for placement)
      return { top: SCREEN_H * 0.18, left: 8, width: SCREEN_W - 16, height: SCREEN_W - 16 };
    case 3: // board again
      return { top: SCREEN_H * 0.18, left: 8, width: SCREEN_W - 16, height: SCREEN_W - 16 };
    case 4: // score bar
      return { top: SCREEN_H * 0.1, left: 16, width: SCREEN_W - 32, height: 52 };
    default:
      return { top: 0, left: 0, width: SCREEN_W, height: SCREEN_H };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TutorialOverlay: React.FC = () => {
  const tutorialStep = useTutorialStore((s) => s.tutorialStep);
  const nextStep = useTutorialStore((s) => s.nextStep);
  const completeTutorial = useTutorialStore((s) => s.completeTutorial);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isActive = tutorialStep !== null;
  const step = tutorialStep ?? 0;
  const stepDef = STEPS[step] ?? STEPS[0]!;
  const spotlight = getSpotlight(step);

  useEffect(() => {
    if (isActive) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, step, fadeAnim]);

  if (!isActive) return null;

  const isLastStep = step === TUTORIAL_TOTAL_STEPS - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeTutorial();
    } else {
      nextStep();
    }
  };

  return (
    <Animated.View
      style={[styles.overlay, { opacity: fadeAnim }]}
      pointerEvents="box-none"
    >
      {/* Dark backdrop — four rects around the spotlight */}
      {/* Top */}
      <View
        style={[
          styles.backdrop,
          { top: 0, left: 0, right: 0, height: spotlight.top },
        ]}
        pointerEvents="none"
      />
      {/* Bottom */}
      <View
        style={[
          styles.backdrop,
          {
            top: spotlight.top + spotlight.height,
            left: 0,
            right: 0,
            bottom: 0,
          },
        ]}
        pointerEvents="none"
      />
      {/* Left */}
      <View
        style={[
          styles.backdrop,
          {
            top: spotlight.top,
            left: 0,
            width: spotlight.left,
            height: spotlight.height,
          },
        ]}
        pointerEvents="none"
      />
      {/* Right */}
      <View
        style={[
          styles.backdrop,
          {
            top: spotlight.top,
            left: spotlight.left + spotlight.width,
            right: 0,
            height: spotlight.height,
          },
        ]}
        pointerEvents="none"
      />

      {/* Spotlight border highlight */}
      <View
        style={[
          styles.spotlightBorder,
          {
            top: spotlight.top - 2,
            left: spotlight.left - 2,
            width: spotlight.width + 4,
            height: spotlight.height + 4,
          },
        ]}
        pointerEvents="none"
      />

      {/* Instruction card */}
      <View
        style={[
          styles.card,
          stepDef.cardPosition === 'top'
            ? { top: spotlight.top - 110 }
            : { top: spotlight.top + spotlight.height + 16 },
        ]}
        pointerEvents="box-none"
      >
        <Text style={styles.cardText}>{stepDef.text}</Text>
        {stepDef.hasNextButton && (
          <TouchableOpacity
            style={styles.nextButton}
            activeOpacity={0.7}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? 'Começar!' : 'Próximo'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Step indicator */}
      <View style={styles.dots} pointerEvents="none">
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === step && styles.dotActive]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
  },
  backdrop: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  spotlightBorder: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ui.accentGlow,
  },
  card: {
    position: 'absolute',
    left: 24,
    right: 24,
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.ui.accent,
    shadowColor: colors.ui.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cardText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.base,
    color: colors.ui.text,
    lineHeight: 22,
    textAlign: 'center',
  },
  nextButton: {
    marginTop: 14,
    alignSelf: 'center',
    backgroundColor: colors.ui.accent,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  nextButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.sm,
    color: colors.ui.text,
  },
  dots: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ui.border,
  },
  dotActive: {
    backgroundColor: colors.ui.accent,
    width: 20,
  },
});

export default React.memo(TutorialOverlay);
