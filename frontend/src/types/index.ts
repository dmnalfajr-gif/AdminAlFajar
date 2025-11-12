export interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  package_type: 'umrah' | 'tour';
  departure_city: string;
  departure_date: string;
  airline: string;
  hotel: string;
  hotel_rating: number;
  facilities: string[];
  itinerary: string[];
  image_url: string;
  availability: number;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  package_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  num_passengers: number;
  total_price: number;
  payment_status: 'pending' | 'completed' | 'failed';
  booking_status: 'confirmed' | 'cancelled';
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  payment_method: 'bank_transfer' | 'credit_card' | 'e_wallet';
  payment_status: 'pending' | 'completed' | 'failed';
  transaction_id: string;
  created_at: string;
  completed_at?: string;
}
