import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { packagesApi, bookingsApi } from '../../src/utils/api';
import { Package } from '../../src/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

export default function PackageDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user, login } = useAuth();
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    customer_phone: '',
    num_passengers: 1,
  });

  useEffect(() => {
    loadPackage();
  }, [id]);

  useEffect(() => {
    if (user) {
      setBookingForm((prev) => ({
        ...prev,
        customer_name: user.name,
        customer_email: user.email,
      }));
    }
  }, [user]);

  const loadPackage = async () => {
    try {
      const response = await packagesApi.getById(id as string);
      setPackageData(response.data);
    } catch (error) {
      console.error('Error loading package:', error);
      Alert.alert('Error', 'Gagal memuat detail paket');
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

  const handleBooking = async () => {
    if (!user) {
      Alert.alert(
        'Login Diperlukan',
        'Silakan login terlebih dahulu untuk melakukan booking',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Login', onPress: login },
        ]
      );
      return;
    }

    if (!bookingForm.customer_name || !bookingForm.customer_email || !bookingForm.customer_phone) {
      Alert.alert('Perhatian', 'Mohon lengkapi semua data');
      return;
    }

    try {
      setLoading(true);
      const response = await bookingsApi.create({
        package_id: id as string,
        ...bookingForm,
      });
      
      Alert.alert(
        'Booking Berhasil',
        'Silakan lanjutkan ke pembayaran',
        [
          {
            text: 'OK',
            onPress: () => router.push(`/booking/${response.data.id}`),
          },
        ]
      );
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Gagal membuat booking');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !packageData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00695C" />
      </View>
    );
  }

  const totalPrice = packageData.price * bookingForm.num_passengers;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Detail Paket</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: packageData.image_url }} style={styles.image} />

        <View style={styles.content}>
          <Text style={styles.title}>{packageData.name}</Text>
          <Text style={styles.price}>{formatPrice(packageData.price)}/orang</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#00695C" />
              <Text style={styles.infoText}>{packageData.duration}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="airplane-takeoff" size={20} color="#00695C" />
              <Text style={styles.infoText}>{packageData.departure_city}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="calendar" size={20} color="#00695C" />
              <Text style={styles.infoText}>{packageData.departure_date}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialCommunityIcons name="account-group" size={20} color="#00695C" />
              <Text style={styles.infoText}>{packageData.availability} kursi</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deskripsi</Text>
            <Text style={styles.description}>{packageData.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fasilitas</Text>
            {packageData.facilities.map((facility, index) => (
              <View key={index} style={styles.facilityItem}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#4CAF50" />
                <Text style={styles.facilityText}>{facility}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itinerary</Text>
            {packageData.itinerary.map((item, index) => (
              <View key={index} style={styles.itineraryItem}>
                <Text style={styles.itineraryText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Hotel & Penerbangan</Text>
            <View style={styles.infoDetail}>
              <MaterialCommunityIcons name="hotel" size={20} color="#00695C" />
              <Text style={styles.infoDetailText}>{packageData.hotel} ({packageData.hotel_rating} Bintang)</Text>
            </View>
            <View style={styles.infoDetail}>
              <MaterialCommunityIcons name="airplane" size={20} color="#00695C" />
              <Text style={styles.infoDetailText}>{packageData.airline}</Text>
            </View>
          </View>

          {/* Booking Form */}
          <View style={styles.bookingSection}>
            <Text style={styles.bookingTitle}>Form Booking</Text>

            <Text style={styles.inputLabel}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              value={bookingForm.customer_name}
              onChangeText={(text) => setBookingForm({ ...bookingForm, customer_name: text })}
              placeholder="Masukkan nama lengkap"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={bookingForm.customer_email}
              onChangeText={(text) => setBookingForm({ ...bookingForm, customer_email: text })}
              placeholder="Masukkan email"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>No. Telepon/WhatsApp</Text>
            <TextInput
              style={styles.input}
              value={bookingForm.customer_phone}
              onChangeText={(text) => setBookingForm({ ...bookingForm, customer_phone: text })}
              placeholder="Masukkan nomor telepon"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Jumlah Jamaah</Text>
            <View style={styles.passengerCounter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  setBookingForm({
                    ...bookingForm,
                    num_passengers: Math.max(1, bookingForm.num_passengers - 1),
                  })
                }
              >
                <MaterialCommunityIcons name="minus" size={24} color="#00695C" />
              </TouchableOpacity>
              <Text style={styles.counterText}>{bookingForm.num_passengers}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() =>
                  setBookingForm({ ...bookingForm, num_passengers: bookingForm.num_passengers + 1 })
                }
              >
                <MaterialCommunityIcons name="plus" size={24} color="#00695C" />
              </TouchableOpacity>
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Pembayaran</Text>
              <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
          <Text style={styles.bookButtonText}>Booking Sekarang</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#00695C',
    padding: 16,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00695C',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 6,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 22,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  facilityText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 8,
  },
  itineraryItem: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  itineraryText: {
    fontSize: 14,
    color: '#212121',
  },
  infoDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoDetailText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 8,
  },
  bookingSection: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  passengerCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginHorizontal: 32,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00695C',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bookButton: {
    backgroundColor: '#00695C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
