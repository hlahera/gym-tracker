import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { RestTimerProvider, useRestTimerContext } from '@/contexts/RestTimerContext';
import { formatRestTime } from '@/hooks/useRestTimer';

/** Icono + etiqueta + padding interno del ítem (sin safe area). */
const TAB_ROW_HEIGHT = 50;

function useTabBarLayout() {
  const insets = useSafeAreaInsets();

  const minBottom = Platform.select({
    ios: 8,
    android: 12,
    web: 12,
    default: 10,
  }) ?? 10;

  const paddingBottom = Math.max(insets.bottom, minBottom);
  const paddingTop = Platform.select({ ios: 8, android: 6, web: 6, default: 6 }) ?? 6;
  const height = paddingTop + TAB_ROW_HEIGHT + paddingBottom;

  return { paddingBottom, paddingTop, height };
}

export default function TabLayout() {
  return (
    <RestTimerProvider>
      <TabsInner />
    </RestTimerProvider>
  );
}

function TabsInner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isWeb = Platform.OS === 'web';
  const timer = useRestTimerContext();
  const tabBar = useTabBarLayout();

  const timerBadge =
    timer.state === 'running'
      ? formatRestTime(timer.remaining)
      : timer.state === 'finished'
        ? '!'
        : undefined;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: isWeb ? 'rgba(5,5,5,0.92)' : colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabBar.height,
          paddingTop: tabBar.paddingTop,
          paddingBottom: tabBar.paddingBottom,
          ...(isWeb
            ? ({
                backdropFilter: 'blur(12px)',
                boxShadow: '0 -1px 0 rgba(255,255,255,0.04)',
                overflow: 'visible',
              } as object)
            : {}),
        },
        tabBarItemStyle: {
          height: TAB_ROW_HEIGHT,
          paddingVertical: 0,
          justifyContent: 'center',
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          lineHeight: 12,
          marginTop: 2,
          marginBottom: 0,
        },
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          color: colors.text,
        },
        headerTintColor: colors.tint,
        headerShadowVisible: false,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Mi gym',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'dumbbell.fill', android: 'fitness_center', web: 'fitness_center' }}
              tintColor={color}
              size={20}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Descanso',
          tabBarBadge: timerBadge,
          tabBarBadgeStyle: {
            fontSize: 10,
            minWidth: 18,
            height: 18,
            lineHeight: 18,
            top: -2,
            ...(timer.state === 'finished' ? { backgroundColor: colors.success } : {}),
          },
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'timer', android: 'timer', web: 'timer' }}
              tintColor={color}
              size={20}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="template"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
              tintColor={color}
              size={20}
            />
          ),
        }}
      />
    </Tabs>
  );
}
