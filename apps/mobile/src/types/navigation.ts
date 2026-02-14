import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/**
 * Screen parameter definitions for the bottom tab navigator.
 */
export type TabParamList = {
  Home: undefined;
  Play: undefined;
  Create: undefined;
  Profile: undefined;
};

/**
 * Screen parameter definitions for the root stack navigator.
 */
export type RootStackParamList = {
  'auth/login': undefined;
  'auth/onboarding': undefined;
  '(tabs)': NavigatorScreenParams<TabParamList>;
  'game/[levelId]': { levelId: string };
};

/**
 * Convenience type for root stack screen props.
 * Usage: `const { navigation, route } = props as RootStackScreenProps<'auth/login'>;`
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/**
 * Convenience type for tab screen props.
 * Usage: `const { navigation, route } = props as TabScreenProps<'Home'>;`
 */
export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<
  TabParamList,
  T
>;

/**
 * Augment the global ReactNavigation namespace so that
 * `useNavigation()` and `useRoute()` are fully typed throughout the app
 * without requiring explicit generics at every call-site.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
