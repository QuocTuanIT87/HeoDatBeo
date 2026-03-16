import { NavigatorScreenParams } from '@react-navigation/native';

export type BottomTabParamList = {
  Home: undefined;
  Statistics: undefined;
  Savings: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Setup: undefined;
  MainApp: NavigatorScreenParams<BottomTabParamList>;
};
