import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlockPaletteProps {
  /** Array of hex colour strings available for selection. */
  colors: string[];
  /** Currently selected hex colour. */
  selectedColor: string;
  /** Callback when a colour swatch is tapped. */
  onColorSelect: (color: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SWATCH_SIZE = 36;
const SWATCH_GAP = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const BlockPalette: React.FC<BlockPaletteProps> = ({
  colors: paletteColors,
  selectedColor,
  onColorSelect,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {paletteColors.map((color) => {
          const isSelected = color === selectedColor;

          return (
            <TouchableOpacity
              key={color}
              activeOpacity={0.7}
              onPress={() => onColorSelect(color)}
              style={[
                styles.swatch,
                { backgroundColor: color },
                isSelected && styles.swatchSelected,
              ]}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SWATCH_GAP,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: SWATCH_SIZE / 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: colors.ui.text,
    shadowColor: colors.ui.text,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default React.memo(BlockPalette);
