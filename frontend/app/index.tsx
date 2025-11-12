import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function IndexScreen() {
  const router = useRouter();
  const { user, loading, login } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // User is authenticated, navigate to home
      router.replace('/(tabs)/home');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Image
          source={{ uri: 'https://customer-assets.emergentagent.com/job_umroh-hemat/artifacts/p94o0k7r_Desain%20tanpa%20judul.png' }}
          style={styles.logo}
        />
        <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://customer-assets.emergentagent.com/job_umroh-hemat/artifacts/p94o0k7r_Desain%20tanpa%20judul.png' }}
            style={styles.logoLarge}
          />
          <Text style={styles.appName}>Umroh Hemat</Text>
          <Text style={styles.appTagline}>by Al Fajar Haramain</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="mosque" size={32} color="#FFD700" />
            <Text style={styles.featureText}>Paket Umrah Terpercaya</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="shield-check" size={32} color="#FFD700" />
            <Text style={styles.featureText}>Aman & Terjamin</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="account-group" size={32} color="#FFD700" />
            <Text style={styles.featureText}>Pembimbing Berpengalaman</Text>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={login}>
          <MaterialCommunityIcons name="google" size={24} color="#FFFFFF" />
          <Text style={styles.loginButtonText}>Masuk dengan Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Text style={styles.guestButtonText}>Lanjutkan sebagai Tamu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00695C',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00695C',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  featuresContainer: {
    marginVertical: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 16,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00695C',
    marginLeft: 12,
  },
  guestButton: {
    alignItems: 'center',
    padding: 16,
  },
  guestButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
});
