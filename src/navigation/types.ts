import { NavigatorScreenParams } from '@react-navigation/native';

export type BottomTabParamList = {
  Home: undefined;
  Budget: undefined;
  Funds: undefined;
  Statistics: { openHistory?: boolean } | undefined;
  Savings: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Setup: undefined;
  MainApp: NavigatorScreenParams<BottomTabParamList>;
  SavingHistory: undefined;
  FundHistory: undefined;
  Guide: undefined;
  BarChart: { selectedMonth: string | null };
  Profile: undefined;
  GoldHistory: undefined;
};
