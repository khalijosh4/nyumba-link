import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'nyumbalink:token';
const USER_KEY = 'nyumbalink:user';

export async function saveSession(token, user) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getSession() {
  const [token, userJson] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(USER_KEY),
  ]);

  return {
    token,
    user: userJson ? JSON.parse(userJson) : null,
  };
}
