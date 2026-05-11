import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import SetupScreen from "../screens/SetupScreen";
import BottomTabNavigator from "./BottomTabNavigator";
import SavingHistoryScreen from "../screens/SavingHistoryScreen";
import FundHistoryScreen from "../screens/FundHistoryScreen";
import GuideScreen from "../screens/GuideScreen";
import { storage } from "../store/storage";
import { View, ActivityIndicator } from "react-native";

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const profile = await storage.getUserProfile();
      setHasProfile(!!profile);
      setIsLoading(false);
    };
    checkProfile();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#d946ef" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={hasProfile ? "MainApp" : "Setup"}
    >
      <Stack.Screen name="Setup" component={SetupScreen} />
      <Stack.Screen name="MainApp" component={BottomTabNavigator} />
      <Stack.Screen name="SavingHistory" component={SavingHistoryScreen} />
      <Stack.Screen name="FundHistory" component={FundHistoryScreen} />
      <Stack.Screen name="Guide" component={GuideScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
