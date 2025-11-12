import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { packagesApi } from '../../src/utils/api';
import { Package } from '../../src/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PackagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>(params.type as string || 'all');

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    filterPackages();
  }, [searchQuery, selectedType, packages]);

  const loadPackages = async () => {
    try {
      const response = await packagesApi.getAll();
      setPackages(response.data);
      setFilteredPackages(response.data);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPackages = () => {
    let filtered = packages;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((pkg) => pkg.package_type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pkg.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPackages(filtered);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderPackageItem = ({ item }: { item: Package }) => (
    <TouchableOpacity
      style={styles.packageItem}
      onPress={() => router.push(`/package/${item.id}`)}
    >
      <Image source={{ uri: item.image_url }} style={styles.packageItemImage} />
      <View style={styles.packageItemInfo}>
        <View style={styles.packageItemHeader}>
          <Text style={styles.packageItemName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {item.package_type === 'umrah' ? 'Umrah' : 'Tour'}
            </Text>
          </View>
        </View>
        <View style={styles.packageItemDetails}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#757575" />
          <Text style={styles.packageItemDetailText}>{item.duration}</Text>
        </View>
        <View style={styles.packageItemDetails}>
          <MaterialCommunityIcons name="airplane-takeoff" size={16} color="#757575" />
          <Text style={styles.packageItemDetailText}>{item.departure_city}</Text>
        </View>
        <Text style={styles.packageItemPrice}>{formatPrice(item.price)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paket Perjalanan</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#757575" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari paket..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedType('all')}
        >
          <Text
            style={[styles.filterTabText, selectedType === 'all' && styles.filterTabTextActive]}
          >
            Semua
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'umrah' && styles.filterTabActive]}
          onPress={() => setSelectedType('umrah')}
        >
          <Text
            style={[
              styles.filterTabText,
              selectedType === 'umrah' && styles.filterTabTextActive,
            ]}
          >
            Umrah
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, selectedType === 'tour' && styles.filterTabActive]}
          onPress={() => setSelectedType('tour')}
        >
          <Text
            style={[styles.filterTabText, selectedType === 'tour' && styles.filterTabTextActive]}
          >
            Tour
          </Text>
        </TouchableOpacity>
      </View>

      {/* Packages List */}
      {loading ? (
        <ActivityIndicator size="large" color="#00695C" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredPackages}
          renderItem={renderPackageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant-closed" size={64} color="#BDBDBD" />
              <Text style={styles.emptyText}>Tidak ada paket ditemukan</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#00695C',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    height: 48,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  filterTabActive: {
    backgroundColor: '#00695C',
  },
  filterTabText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  packageItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  packageItemImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  packageItemInfo: {
    padding: 16,
  },
  packageItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  packageItemName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00695C',
  },
  packageItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  packageItemDetailText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 6,
  },
  packageItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00695C',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginTop: 16,
  },
});
