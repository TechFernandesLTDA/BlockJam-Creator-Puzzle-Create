import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { theme } from '@/theme/theme';
import { colors } from '@/theme/colors';
import type { RootStackParamList } from '@/types/navigation';
import { SCREEN_NAMES } from '@/utils/constants';

// Screen imports -
// These are lazily-loaded via React.lazy where supported, but for React Native
// we import them directly. The actual screen files will live at these paths.
import AuthLoginScreen from '@/app/auth/login';
import AuthOnboardingScreen from '@/app/auth/onboarding';
import TabsLayout from '@/app/(tabs)/_layout';
import GameLevelScreen from '@/app/game/[levelId]';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * React Navigation theme derived from the app's Paper / colors theme
 * so that native navigation elements (headers, backgrounds) are consistent.
 */
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.ui.accent,
    background: colors.bg.primary,
    card: colors.bg.secondary,
    text: colors.ui.text,
    border: colors.ui.border,
    notification: colors.ui.error,
  },
};

/**
 * Root layout for the BlockJam Creator app.
 *
 * Wraps the entire app in the required providers:
 * - GestureHandlerRootView (react-native-gesture-handler)
 * - SafeAreaProvider (react-native-safe-area-context)
 * - PaperProvider (react-native-paper with custom MD3 dark theme)
 * - NavigationContainer (react-navigation)
 *
 * The stack defines four route groups:
 * 1. auth/login        -- Sign-in / sign-up screen
 * 2. auth/onboarding   -- First-run tutorial flow
 * 3. (tabs)            -- Main bottom-tab navigator
 * 4. game/[levelId]    -- Full-screen gameplay (presented as a modal)
 */
export default function RootLayout(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={colors.bg.primary}
            translucent={false}
          />
          <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator
              initialRouteName={SCREEN_NAMES.AUTH_LOGIN}
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: { backgroundColor: colors.bg.primary },
              }}
            >
              {/* Auth flow */}
              <Stack.Screen
                name={SCREEN_NAMES.AUTH_LOGIN}
                component={AuthLoginScreen}
                options={{
                  animationTypeForReplace: 'pop',
                }}
              />
              <Stack.Screen
                name={SCREEN_NAMES.AUTH_ONBOARDING}
                component={AuthOnboardingScreen}
                options={{
                  animation: 'slide_from_right',
                }}
              />

              {/* Main tab navigator */}
              <Stack.Screen
                name={SCREEN_NAMES.TABS}
                component={TabsLayout}
                options={{
                  animation: 'fade',
                }}
              />

              {/* Game play screen -- presented modally from the bottom */}
              <Stack.Screen
                name={SCREEN_NAMES.GAME_LEVEL}
                component={GameLevelScreen}
                options={{
                  animation: 'slide_from_bottom',
                  presentation: 'modal',
                  gestureEnabled: true,
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
});
