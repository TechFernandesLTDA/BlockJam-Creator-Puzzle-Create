import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@/theme/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EditorTool = 'paint' | 'erase' | 'fill';

interface ToolBarProps {
  /** The currently active editor tool. */
  selectedTool: EditorTool;
  /** Callback when a tool button is tapped. */
  onToolSelect: (tool: EditorTool) => void;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

interface ToolDef {
  key: EditorTool;
  label: string;
  icon: string;
}

const TOOLS: ToolDef[] = [
  { key: 'paint', label: 'Paint', icon: '\u270F\uFE0F' },  // pencil
  { key: 'erase', label: 'Erase', icon: '\u2716' },        // eraser (X mark)
  { key: 'fill', label: 'Fill', icon: '\u{1F4A7}' },       // bucket (droplet)
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ToolBar: React.FC<ToolBarProps> = ({ selectedTool, onToolSelect }) => {
  return (
    <View style={styles.container}>
      {TOOLS.map((tool) => {
        const isSelected = selectedTool === tool.key;

        return (
          <TouchableOpacity
            key={tool.key}
            activeOpacity={0.7}
            onPress={() => onToolSelect(tool.key)}
            style={[
              styles.button,
              isSelected ? styles.buttonSelected : styles.buttonDefault,
            ]}
          >
            <Text style={styles.icon}>{tool.icon}</Text>
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelSelected : styles.labelDefault,
              ]}
            >
              {tool.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  buttonSelected: {
    backgroundColor: colors.ui.accent,
  },
  buttonDefault: {
    backgroundColor: colors.bg.surface,
  },
  icon: {
    fontSize: 16,
    color: colors.ui.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.ui.text,
  },
  labelDefault: {
    color: colors.ui.textSoft,
  },
});

export default React.memo(ToolBar);
