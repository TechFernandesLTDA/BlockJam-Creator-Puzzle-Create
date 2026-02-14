export const colors = {
  bg: {
    primary: '#0A0E27',
    secondary: '#131842',
    surface: '#1C2251',
    elevated: '#252B6A',
  },

  blocks: {
    red: '#FF3B6F',
    blue: '#3B82F6',
    green: '#22D68A',
    yellow: '#FBBF24',
    purple: '#A855F7',
    orange: '#FB923C',
    cyan: '#22D3EE',
    pink: '#F472B6',
  },

  ui: {
    text: '#FFFFFF',
    textSoft: '#94A3B8',
    accent: '#6366F1',
    accentGlow: '#818CF8',
    success: '#22D68A',
    warning: '#FBBF24',
    error: '#FF3B6F',
    border: '#2D3470',
  },

  gradients: {
    primary: ['#6366F1', '#A855F7'] as const,
    gold: ['#FBBF24', '#FB923C'] as const,
    fire: ['#FF3B6F', '#FB923C'] as const,
    ocean: ['#3B82F6', '#22D3EE'] as const,
    neon: ['#22D68A', '#22D3EE'] as const,
  },
} as const;

export type BlockColorName = keyof typeof colors.blocks;
