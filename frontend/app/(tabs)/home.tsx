import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { packagesApi } from '../../src/utils/api';
import { Package } from '../../src/types';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [featuredPackages, setFeaturedPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedPackages();
  }, []);

  const loadFeaturedPackages = async () => {
    try {
      const response = await packagesApi.getAll({ package_type: 'umrah' });
      setFeaturedPackages(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Assalamu'alaikum</Text>
            <Text style={styles.headerName}>{user?.name || 'Guest'}</Text>
          </View>
          <Image
            source={{ uri: 'https://customer-assets.emergentagent.com/job_umroh-hemat/artifacts/p94o0k7r_Desain%20tanpa%20judul.png' }}
            style={styles.logo}
          />
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={{
              uri: 'https://customer-assets.emergentagent.com/job_79e30beb-e67a-407d-a760-de0870f79c88/artifacts/6acxsbs7_WhatsApp%20Image%202025-11-11%20at%2014.17.01.jpeg',
            }}
            style={styles.heroBannerImage}
          />
        </View>

        {/* Quick Access */}
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() => router.push('/(tabs)/packages?type=umrah')}
          >
            <MaterialCommunityIcons name="kaaba" size={32} color="#FFD700" />
            <Text style={styles.quickAccessText}>Paket Umrah</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() => router.push('/(tabs)/packages?type=tour')}
          >
            <MaterialCommunityIcons name="airplane" size={32} color="#FFD700" />
            <Text style={styles.quickAccessText}>Tour & Travel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() => router.push('/(tabs)/bookings')}
          >
            <MaterialCommunityIcons name="book-open-variant" size={32} color="#FFD700" />
            <Text style={styles.quickAccessText}>Riwayat</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Packages */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Paket Unggulan</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/packages')}>
              <Text style={styles.seeAll}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#00695C" style={{ marginTop: 20 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredPackages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.id}
                  style={styles.packageCard}
                  onPress={() => router.push(`/package/${pkg.id}`)}
                >
                  <Image source={{ uri: pkg.image_url }} style={styles.packageImage} />
                  <View style={styles.packageInfo}>
                    <Text style={styles.packageName} numberOfLines={2}>
                      {pkg.name}
                    </Text>
                    <Text style={styles.packageDuration}>{pkg.duration}</Text>
                    <Text style={styles.packagePrice}>{formatPrice(pkg.price)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <MaterialCommunityIcons name="information" size={24} color="#00695C" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>Informasi Penting</Text>
            <Text style={styles.infoText}>
              Ketahui persyaratan visa, tips perjalanan, dan panduan ibadah Umrah
            </Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Hubungi Kami</Text>
          <TouchableOpacity style={styles.contactButton}>
            <MaterialCommunityIcons name="whatsapp" size={24} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>0811-1149-444</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#00695C',
  },
  headerGreeting: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  headerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
  },
  heroBanner: {
    width: width,
    height: 200,
    marginBottom: 16,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickAccessItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: (width - 64) / 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickAccessText: {
    marginTop: 8,
    fontSize: 12,
    color: '#00695C',
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  seeAll: {
    fontSize: 14,
    color: '#00695C',
    fontWeight: '600',
  },
  packageCard: {
    width: width * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  packageImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  packageInfo: {
    padding: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  packageDuration: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00695C',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00695C',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
  },
  contactSection: {
    padding: 16,
    marginBottom: 32,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    padding: 16,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
