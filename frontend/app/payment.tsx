import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { paymentsApi } from '../src/utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type PaymentMethod = 'bank_transfer' | 'credit_card' | 'e_wallet';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
}

export default function PaymentScreen() {
  const router = useRouter();
  const { booking_id } = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);

  const paymentMethods: PaymentOption[] = [
    {
      id: 'bank_transfer',
      name: 'Transfer Bank',
      icon: 'bank',
      description: 'BCA, Mandiri, BNI, BRI',
    },
    {
      id: 'credit_card',
      name: 'Kartu Kredit/Debit',
      icon: 'credit-card',
      description: 'Visa, Mastercard, JCB',
    },
    {
      id: 'e_wallet',
      name: 'E-Wallet',
      icon: 'wallet',
      description: 'GoPay, OVO, DANA, ShopeePay',
    },
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Perhatian', 'Silakan pilih metode pembayaran');
      return;
    }

    try {
      setProcessing(true);

      // Create payment
      const paymentResponse = await paymentsApi.create({
        booking_id: booking_id as string,
        payment_method: selectedMethod,
      });

      // Simulate payment processing (mock payment)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Complete payment
      await paymentsApi.complete(paymentResponse.data.id);

      Alert.alert(
        'Pembayaran Berhasil!',
        'Terima kasih atas pembayaran Anda. Kami akan segera memproses booking Anda.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)/bookings'),
          },
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Gagal memproses pembayaran. Silakan coba lagi.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Metode Pembayaran</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Mock Payment Notice */}
          <View style={styles.noticeCard}>
            <MaterialCommunityIcons name="information" size={24} color="#00695C" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.noticeTitle}>Mode Simulasi</Text>
              <Text style={styles.noticeText}>
                Ini adalah simulasi pembayaran. Tidak ada biaya yang akan dikenakan.
              </Text>
            </View>
          </View>

          {/* Payment Methods */}
          <Text style={styles.sectionTitle}>Pilih Metode Pembayaran</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethodCard,
                selectedMethod === method.id && styles.paymentMethodCardSelected,
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={styles.paymentMethodLeft}>
                <View
                  style={[
                    styles.iconContainer,
                    selectedMethod === method.id && styles.iconContainerSelected,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={method.icon as any}
                    size={28}
                    color={selectedMethod === method.id ? '#FFFFFF' : '#00695C'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.methodName}>{method.name}</Text>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name={selectedMethod === method.id ? 'radiobox-marked' : 'radiobox-blank'}
                size={24}
                color={selectedMethod === method.id ? '#00695C' : '#BDBDBD'}
              />
            </TouchableOpacity>
          ))}

          {/* Instructions */}
          {selectedMethod && (
            <View style={styles.instructionCard}>
              <Text style={styles.instructionTitle}>
                {selectedMethod === 'bank_transfer' && 'Instruksi Transfer Bank'}
                {selectedMethod === 'credit_card' && 'Pembayaran Kartu Kredit'}
                {selectedMethod === 'e_wallet' && 'Pembayaran E-Wallet'}
              </Text>
              <Text style={styles.instructionText}>
                {selectedMethod === 'bank_transfer' &&
                  'Setelah klik "Bayar Sekarang", Anda akan mendapatkan nomor rekening virtual account untuk transfer.'}
                {selectedMethod === 'credit_card' &&
                  'Anda akan diarahkan ke halaman aman untuk memasukkan detail kartu kredit/debit Anda.'}
                {selectedMethod === 'e_wallet' &&
                  'Setelah klik "Bayar Sekarang", aplikasi e-wallet akan terbuka untuk konfirmasi pembayaran.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedMethod || processing) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!selectedMethod || processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="lock" size={20} color="#FFFFFF" />
              <Text style={styles.payButtonText}>Bayar Sekarang</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.secureText}>Transaksi aman & terenkripsi</Text>
      </View>
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
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00695C',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#424242',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  paymentMethodCardSelected: {
    borderColor: '#00695C',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconContainerSelected: {
    backgroundColor: '#00695C',
  },
  methodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 12,
    color: '#757575',
  },
  instructionCard: {
    backgroundColor: '#FFF9C4',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F57F17',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
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
  payButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secureText: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
  },
});
