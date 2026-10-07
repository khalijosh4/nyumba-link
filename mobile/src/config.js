import { Platform } from 'react-native';

const resolveApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  if (Platform.OS === 'android') return 'http://10.0.2.2:5001/api';
  return 'http://localhost:5001/api';
};

export const API_BASE_URL = resolveApiUrl();
export const APP_NAME = 'NyumbaLink';
