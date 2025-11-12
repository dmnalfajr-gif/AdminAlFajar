import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { bookingsApi, packagesApi, paymentsApi } from '../../src/utils/api';
import { Booking, Package } from '../../src/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [packageData, setPackageData] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookingDetails();
  }, [id]);

  const loadBookingDetails = async () => {
    try {
      const bookingResponse = await bookingsApi.getById(id as string);
      setBooking(bookingResponse.data);

      const packageResponse = await packagesApi.getById(bookingResponse.data.package_id);
      setPackageData(packageResponse.data);
    } catch (error) {
      console.error('Error loading booking:', error);
      Alert.alert('Error', 'Gagal memuat detail booking');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Lunas';
      case 'pending':
        return 'Menunggu Pembayaran';
      case 'failed':
        return 'Gagal';
      default:
        return status;
    }
  };

  const handlePayment = () => {
    router.push({
      pathname: '/payment',
      params: { booking_id: id },
    });
  };

  if (loading || !booking || !packageData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00695C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Status Badge */}
          <View
            style={[
              styles.statusBadgeLarge,
              { backgroundColor: getStatusColor(booking.payment_status) },
            ]}
          >
            <MaterialCommunityIcons
              name={booking.payment_status === 'completed' ? 'check-circle' : 'clock-outline'}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.statusTextLarge}>{getStatusText(booking.payment_status)}</Text>
          </View>

          {/* Booking Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Booking</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order ID:</Text>
              <Text style={styles.infoValue}>#{booking.id.slice(0, 8)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tanggal Booking:</Text>
              <Text style={styles.infoValue}>{formatDate(booking.created_at)}</Text>
            </View>
          </View>

          {/* Package Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paket yang Dipesan</Text>
            <Text style={styles.packageName}>{packageData.name}</Text>
            <View style={styles.packageDetails}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#757575" />
              <Text style={styles.packageDetailText}>{packageData.duration}</Text>
            </View>
            <View style={styles.packageDetails}>
              <MaterialCommunityIcons name="calendar" size={16} color="#757575" />
              <Text style={styles.packageDetailText}>{packageData.departure_date}</Text>
            </View>
          </View>

          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Jamaah</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama:</Text>
              <Text style={styles.infoValue}>{booking.customer_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{booking.customer_email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Telepon:</Text>
              <Text style={styles.infoValue}>{booking.customer_phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jumlah Jamaah:</Text>
              <Text style={styles.infoValue}>{booking.num_passengers} orang</Text>
            </View>
          </View>

          {/* Payment Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rincian Pembayaran</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Harga per orang:</Text>
              <Text style={styles.priceValue}>{formatPrice(packageData.price)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Jumlah jamaah:</Text>
              <Text style={styles.priceValue}>x{booking.num_passengers}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Pembayaran:</Text>
              <Text style={styles.totalValue}>{formatPrice(booking.total_price)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      {booking.payment_status === 'pending' && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
            <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" />
            <Text style={styles.payButtonText}>Bayar Sekarang</Text>
          </TouchableOpacity>
        </View>
      )}
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
  content: {
    padding: 16,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusTextLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  packageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00695C',
    marginBottom: 8,
  },
  packageDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  packageDetailText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#757575',
  },
  priceValue: {
    fontSize: 14,
    color: '#212121',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00695C',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00695C',
    padding: 16,
    borderRadius: 12,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
