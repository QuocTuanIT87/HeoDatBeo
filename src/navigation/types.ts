import { NavigatorScreenParams } from '@react-navigation/native';

export type BottomTabParamList = {
  Home: undefined;
  Budget: undefined;
  Statistics: undefined;
  Savings: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Setup: undefined;
  MainApp: NavigatorScreenParams<BottomTabParamList>;
  SavingHistory: undefined;
  Guide: undefined;
};
