import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';

import { colors } from '@/theme/colors';
import type { TabParamList } from '@/types/navigation';
import { SCREEN_NAMES } from '@/utils/constants';

// Tab screen imports -- these will be created as individual screen files.
import HomeScreen from '@/app/(tabs)/home';
import PlayScreen from '@/app/(tabs)/play';
import CreateScreen from '@/app/(tabs)/create';
import ProfileScreen from '@/app/(tabs)/profile';

const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Unicode / emoji icon map for the four bottom tabs.
 * These are temporary stand-ins; replace with a proper icon library later.
 *
 * Using distinct unicode symbols so the tab bar is usable right away:
 *   Home    -> newspaper / feed-like icon
 *   Play    -> game controller
 *   Create  -> circled plus
 *   Profile -> bust silhouette
 */
const TAB_ICONS: Record<keyof TabParamList, { active: string; inactive: string }> = {
  Home: { active: '\u2302', inactive: '\u2302' },       // ⌂ House
  Play: { active: '\u25B6', inactive: '\u25B7' },       // ▶ / ▷
  Create: { active: '\u2295', inactive: '\u2295' },     // ⊕ Circled plus
  Profile: { active: '\u2603', inactive: '\u2603' },    // ☃ (placeholder person)
};

const ACTIVE_COLOR = colors.ui.accent;           // #6366F1
const INACTIVE_COLOR = colors.ui.textSoft;        // #94A3B8
const TAB_BAR_BG = 'rgba(19, 24, 66, 0.90)';    // #131842 at 90% opacity

/**
 * Renders the icon for a given tab.
 * Accepts the route name, focused state, and the tint color from the navigator.
 */
function TabIcon({
  routeName,
  focused,
  color,
}: {
  routeName: keyof TabParamList;
  focused: boolean;
  color: string;
}): React.JSX.Element {
  const icons = TAB_ICONS[routeName];
  const symbol = focused ? icons.active : icons.inactive;

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, { color }]}>{symbol}</Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

/**
 * Custom tab bar background that provides a glassmorphism effect.
 *
 * On iOS we use the native BlurView for a real frosted-glass look.
 * On Android (where BlurView support is less reliable) we fall back
 * to a semi-transparent navy background that approximates the effect.
 */
function TabBarBackground(): React.JSX.Element {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        blurType="dark"
        blurAmount={24}
        reducedTransparencyFallbackColor={colors.bg.secondary}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  // Android fallback -- solid colour with opacity already baked in.
  return <View style={[StyleSheet.absoluteFill, styles.androidBlurFallback]} />;
}

/**
 * Bottom tab navigator layout with four tabs: Home, Play, Create, Profile.
 *
 * The tab bar uses a glassmorphism-style appearance:
 *  - Dark navy background (#131842) at 90% opacity
 *  - Native blur effect on iOS
 *  - Active tab highlighted with the app accent colour (#6366F1)
 *  - A small glowing dot beneath the active tab icon
 */
export default function TabsLayout(): React.JSX.Element {
  return (
    <Tab.Navigator
      initialRouteName={SCREEN_NAMES.TAB_HOME}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <TabBarBackground />,
        tabBarIcon: ({ focused, color }) => (
          <TabIcon
            routeName={route.name as keyof TabParamList}
            focused={focused}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen
        name={SCREEN_NAMES.TAB_HOME}
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.TAB_PLAY}
        component={PlayScreen}
        options={{ tabBarLabel: 'Play' }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.TAB_CREATE}
        component={CreateScreen}
        options={{ tabBarLabel: 'Create' }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.TAB_PROFILE}
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.select({ ios: 88, default: 64 }),
    paddingBottom: Platform.select({ ios: 24, default: 8 }),
    paddingTop: 8,
    backgroundColor: TAB_BAR_BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.ui.border,
    elevation: 0, // Remove Android shadow so the glass effect is clean
  },
  tabLabel: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 11,
    marginTop: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 28,
  },
  icon: {
    fontSize: 22,
    textAlign: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACTIVE_COLOR,
    shadowColor: ACTIVE_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  androidBlurFallback: {
    backgroundColor: TAB_BAR_BG,
  },
});
