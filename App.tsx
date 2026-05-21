import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import './src/utils/notifications';
import * as Notifications from 'expo-notifications';
import { CustomAlert } from './src/components/CustomAlert';

const navigationRef = createNavigationContainerRef<any>();

export default function App() {
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (
      lastNotificationResponse &&
      navigationRef.isReady()
    ) {
      const type = lastNotificationResponse.notification.request.content.data?.type;
      if (type === 'daily_report' || type === 'monthly_report' || type === 'yearly_report') {
        navigationRef.navigate('MainApp', { screen: 'Statistics', params: { openHistory: true } });
      } else if (type === 'reminder') {
        navigationRef.navigate('MainApp', { screen: 'Home' });
      }
    }
  }, [lastNotificationResponse]);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
      <CustomAlert />
    </SafeAreaProvider>
  );
}

