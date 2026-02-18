import { create } from 'zustand';

import { STORAGE_KEYS } from '@/utils/constants';
import { getStorage } from '@/utils/storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TutorialState {
  /** Current tutorial step (null = tutorial inactive). */
  tutorialStep: number | null;
  /** Whether the player has already completed the tutorial. */
  tutorialCompleted: boolean;
  /** IDs of tips that have already been shown. */
  shownTips: Set<string>;
  /** Currently visible contextual tip, or null. */
  activeTip: { id: string; message: string } | null;
  /** Cells to highlight for the hint feature, or null. */
  hintCells: { row: number; col: number }[] | null;
}

interface TutorialActions {
  /** Start the tutorial from step 0 (no-op if already completed). */
  startTutorial: () => void;
  /** Advance to the next tutorial step. */
  nextStep: () => void;
  /** Mark the tutorial as completed and persist to storage. */
  completeTutorial: () => void;
  /** Show a contextual tip (ignored if already seen). */
  showTip: (id: string, message: string) => void;
  /** Dismiss the active tip and mark it as seen. */
  dismissTip: () => void;
  /** Highlight hint cells on the board. */
  showHint: (cells: { row: number; col: number }[]) => void;
  /** Clear hint highlights. */
  clearHint: () => void;
}

type TutorialStore = TutorialState & TutorialActions;

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function loadShownTips(): Set<string> {
  try {
    const raw = getStorage().getString(STORAGE_KEYS.TIPS_SEEN);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      return new Set(parsed);
    }
  } catch {
    // ignore
  }
  return new Set();
}

function persistShownTips(tips: Set<string>): void {
  try {
    getStorage().set(STORAGE_KEYS.TIPS_SEEN, JSON.stringify([...tips]));
  } catch {
    // ignore
  }
}

function isTutorialCompleted(): boolean {
  try {
    return getStorage().getString(STORAGE_KEYS.TUTORIAL_COMPLETED) === 'true';
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Total number of tutorial steps
// ---------------------------------------------------------------------------

export const TUTORIAL_TOTAL_STEPS = 5;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  tutorialStep: null,
  tutorialCompleted: false,
  shownTips: new Set(),
  activeTip: null,
  hintCells: null,

  startTutorial: () => {
    if (isTutorialCompleted()) {
      set({ tutorialCompleted: true, shownTips: loadShownTips() });
      return;
    }
    set({
      tutorialStep: 0,
      tutorialCompleted: false,
      shownTips: loadShownTips(),
    });
  },

  nextStep: () => {
    const { tutorialStep } = get();
    if (tutorialStep === null) return;

    const next = tutorialStep + 1;
    if (next >= TUTORIAL_TOTAL_STEPS) {
      get().completeTutorial();
    } else {
      set({ tutorialStep: next });
    }
  },

  completeTutorial: () => {
    try {
      getStorage().set(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');
    } catch {
      // ignore
    }
    set({ tutorialStep: null, tutorialCompleted: true });
  },

  showTip: (id: string, message: string) => {
    const { shownTips, activeTip, tutorialStep } = get();
    // Don't show tips during the tutorial or if already seen / another is visible
    if (tutorialStep !== null) return;
    if (shownTips.has(id)) return;
    if (activeTip !== null) return;

    set({ activeTip: { id, message } });
  },

  dismissTip: () => {
    const { activeTip, shownTips } = get();
    if (!activeTip) return;

    const updated = new Set(shownTips);
    updated.add(activeTip.id);
    persistShownTips(updated);

    set({ activeTip: null, shownTips: updated });
  },

  showHint: (cells) => {
    set({ hintCells: cells });
  },

  clearHint: () => {
    set({ hintCells: null });
  },
}));
