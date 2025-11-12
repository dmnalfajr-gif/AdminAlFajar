import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="package/[id]" />
        <Stack.Screen name="booking/[id]" />
        <Stack.Screen name="payment" />
      </Stack>
    </AuthProvider>
  );
}
