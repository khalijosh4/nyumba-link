import React, { useEffect, useMemo, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi, listingsApi } from './src/services/api';
import { mockListings } from './src/data/mockListings';
import { APP_NAME } from './src/config';
import { clearSession, getSession, saveSession } from './src/storage/authStorage';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AUTH_STATE = { token: null, user: null };

function formatPrice(value) {
  return `KSh ${Number(value || 0).toLocaleString()}`;
}

function normalizeListings(data) {
  const list = data?.items || data?.listings || data || [];
  return Array.isArray(list) ? list : mockListings;
}

function AuthScreen({ navigation }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: 'tenant@example.com',
    phone: '254712345678',
    password: 'Password123!',
    role: 'tenant',
  });

  const submit = async () => {
    try {
      if (!form.email || !form.password) {
        Alert.alert('Missing fields', 'Email and password are required.');
        return;
      }

      setLoading(true);

      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { ...form, role: form.role || 'tenant' };

      const response = await (mode === 'login' ? authApi.login(payload) : authApi.register(payload));
      const result = response.data || {};
      AUTH_STATE.token = result.token || null;
      AUTH_STATE.user = result.user || null;

      if (AUTH_STATE.token) {
        await saveSession(AUTH_STATE.token, AUTH_STATE.user);
      }

      Alert.alert('Success', mode === 'login' ? 'Welcome back!' : 'Account created successfully.');
      navigation.replace('MainTabs');
    } catch (error) {
      const message = error?.response?.data?.error || 'Authentication failed.';
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.authContainer}>
        <LinearGradient colors={['#EAF7EF', '#F4FAF6']} style={styles.authHero}>
          <Text style={styles.authBadge}>NyumbaLink</Text>
          <Text style={styles.authTitle}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>
          <Text style={styles.authSubtext}>Find homes, book viewings, and manage rentals.</Text>
        </LinearGradient>

        {mode === 'register' && (
          <>
            <TextInput
              placeholder="First name"
              value={form.first_name}
              onChangeText={(text) => setForm((prev) => ({ ...prev, first_name: text }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Last name"
              value={form.last_name}
              onChangeText={(text) => setForm((prev) => ({ ...prev, last_name: text }))}
              style={styles.input}
            />
          </>
        )}

        <TextInput
          placeholder="Email"
          value={form.email}
          keyboardType="email-address"
          onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
          style={styles.input}
        />

        {mode === 'register' && (
          <TextInput
            placeholder="Phone"
            value={form.phone}
            onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
            style={styles.input}
            keyboardType="phone-pad"
          />
        )}

        <TextInput
          placeholder="Password"
          value={form.password}
          secureTextEntry
          onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
          style={styles.input}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{mode === 'login' ? 'Login' : 'Register'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode((prev) => prev === 'login' ? 'register' : 'login')} style={styles.switchRow}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await listingsApi.getAll({ limit: 6 });
        setListings(normalizeListings(data));
      } catch (error) {
        setListings(mockListings);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient colors={['#EAF7EF', '#F9FBFA']} style={styles.hero}>
          <Text style={styles.eyebrow}>Welcome to</Text>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.subtitle}>Find rentals across Nairobi and Kiambu.</Text>

          <View style={styles.searchBox}>
            <TextInput placeholder="Search by area or keyword" style={styles.searchInput} placeholderTextColor="#7a8d83" />
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured homes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
            <Text style={styles.linkText}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#146c43" />
            <Text style={styles.loadingText}>Loading homes...</Text>
          </View>
        ) : (
          listings.map((item) => (
            <TouchableOpacity
              key={item.id || `${item.title}-${item.location}`}
              style={styles.card}
              onPress={() => navigation.navigate('ListingDetails', { listing: item })}
            >
              <Image source={{ uri: item.image || item.primary_image || item.images?.[0]?.url }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.price}>{formatPrice(item.monthly_rent || item.price)}</Text>
                </View>
                <Text style={styles.location}>{item.area || item.location}</Text>
                <Text style={styles.meta}>
                  {item.room_type || item.type || 'Home'} • {item.bedrooms || 1} bed • {item.bathrooms || 1} bath
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ListingsScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await listingsApi.getAll({ limit: 12 });
        setListings(normalizeListings(data));
      } catch (error) {
        setListings(mockListings);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={{ padding: 16 }}>
        <Text style={styles.screenTitle}>Available listings</Text>

        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator color="#146c43" /><Text style={styles.loadingText}>Loading listings...</Text></View>
        ) : listings.map((item) => (
          <TouchableOpacity key={item.id || `${item.title}-${item.location}`} style={styles.listCard} onPress={() => {}}>
            <Image source={{ uri: item.image || item.primary_image || item.images?.[0]?.url }} style={styles.listImage} />
            <View style={{ padding: 12 }}>
              <Text style={styles.listTitle}>{item.title}</Text>
              <Text style={styles.listPrice}>{formatPrice(item.monthly_rent || item.price)}</Text>
              <Text style={styles.location}>{item.area || item.location}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ListingDetailsScreen({ route }) {
  const { listing } = route.params || {};

  if (!listing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.screenTitle}>Listing not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <Image source={{ uri: listing.image || listing.primary_image || listing.images?.[0]?.url }} style={styles.detailImage} />
        <View style={{ padding: 16 }}>
          <Text style={styles.screenTitle}>{listing.title}</Text>
          <Text style={styles.detailPrice}>{formatPrice(listing.monthly_rent || listing.price)}</Text>
          <Text style={styles.location}>{listing.area || listing.location}</Text>
          <Text style={styles.detailDescription}>{listing.description}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => Alert.alert('Viewing requested', 'This feature is ready for your booking flow.') }>
            <Text style={styles.primaryButtonText}>Book viewing</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AccountScreen() {
  const user = AUTH_STATE.user;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.accountBox}>
        <Text style={styles.screenTitle}>{user ? `${user.first_name || 'Hello'} ${user.last_name || ''}`.trim() : 'Account'}</Text>
        <Text style={styles.accountText}>
          {user ? `Signed in as ${user.email || 'your account'}` : 'Login or create an account to manage your bookings.'}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => Alert.alert('Coming soon', 'Profile and bookings screen are ready for expansion.') }>
          <Text style={styles.primaryButtonText}>{user ? 'My profile' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Browse" component={ListingsScreen} options={{ title: 'Browse listings' }} />
      <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} options={{ title: 'Property details' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 72, paddingBottom: 10, paddingTop: 8, borderTopColor: '#DDEAE1' },
        tabBarActiveTintColor: '#146c43',
      }}
    >
      <Tab.Screen name="Discover" component={HomeStack} />
      <Tab.Screen name="BrowseTab" component={ListingsScreen} options={{ title: 'Browse' }} />
      <Tab.Screen name="AccountTab" component={AccountScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const bootstrapSession = async () => {
      const session = await getSession();
      AUTH_STATE.token = session.token || null;
      AUTH_STATE.user = session.user || null;
      setLoggedIn(Boolean(session.token));
      setLoadingSession(false);
    };

    bootstrapSession();
  }, []);

  if (loadingSession) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#146c43" />
        <Text style={{ marginTop: 12, color: '#365745' }}>Loading NyumbaLink...</Text>
      </SafeAreaView>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!loggedIn ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5FAF7' },
  container: { padding: 18, paddingBottom: 36 },
  authContainer: { padding: 18, paddingBottom: 36 },
  authHero: { borderRadius: 24, padding: 24, marginBottom: 18 },
  authBadge: { color: '#146c43', fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 12 },
  authTitle: { fontSize: 28, fontWeight: '800', color: '#0F1D17', marginTop: 8 },
  authSubtext: { fontSize: 15, color: '#3F5E50', marginTop: 8 },
  hero: { borderRadius: 24, padding: 22, marginBottom: 18, shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  eyebrow: { color: '#3a6b52', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { color: '#0D1F17', fontSize: 28, fontWeight: '800', marginTop: 6 },
  subtitle: { marginTop: 8, color: '#315443', fontSize: 15 },
  searchBox: { marginTop: 18, backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 12, height: 48, justifyContent: 'center' },
  searchInput: { fontSize: 14, color: '#1f2b25' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 6 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0f1d17' },
  linkText: { color: '#146c43', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', marginBottom: 16, shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardImage: { width: '100%', height: 180 },
  cardBody: { padding: 14 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0d1f17', flex: 1 },
  price: { fontSize: 14, color: '#146c43', fontWeight: '800' },
  location: { fontSize: 13, color: '#567a68', marginTop: 6 },
  meta: { fontSize: 12, color: '#4a5d52', marginTop: 8 },
  loadingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginLeft: 10, color: '#365745' },
  screenTitle: { fontSize: 24, fontWeight: '800', color: '#0d1f17', marginBottom: 16 },
  listCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  listImage: { width: '100%', height: 180 },
  listTitle: { fontSize: 18, fontWeight: '700', color: '#0f1d17' },
  listPrice: { fontSize: 15, color: '#146c43', fontWeight: '700', marginTop: 4 },
  detailImage: { width: '100%', height: 260 },
  detailPrice: { fontSize: 22, fontWeight: '800', color: '#146c43', marginBottom: 8 },
  detailDescription: { fontSize: 15, lineHeight: 22, color: '#324b40', marginTop: 16, marginBottom: 20 },
  primaryButton: { backgroundColor: '#146c43', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D9E6DE', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15 },
  switchRow: { marginTop: 16, alignItems: 'center' },
  switchText: { color: '#146c43', fontWeight: '700' },
  accountBox: { flex: 1, padding: 20, justifyContent: 'center' },
  accountText: { fontSize: 16, color: '#455c53', marginBottom: 24 },
});
