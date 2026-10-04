import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Polyfill WebSocket for Node.js (Expo Router SSR / Metro web bundling environment)
if (typeof window === 'undefined' && typeof globalThis !== 'undefined' && !globalThis.WebSocket) {
  try {
    const WebSocketPolyfill = require('ws');
    globalThis.WebSocket = WebSocketPolyfill;
  } catch (e) {
    // Fallback if ws cannot be loaded
  }
}

// Memory storage for SSR / Node environment where window/localStorage is undefined
const memoryStorage = new Map<string, string>();

const CustomStorageAdapter = {
  getItem: (key: string): Promise<string | null> => {
    if (typeof window === 'undefined') {
      return Promise.resolve(memoryStorage.get(key) || null);
    }
    if (Platform.OS === 'web') {
      try {
        return Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
      } catch (e) {
        return Promise.resolve(null);
      }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') {
      memoryStorage.set(key, value);
      return Promise.resolve();
    }
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch (e) {}
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    if (typeof window === 'undefined') {
      memoryStorage.delete(key);
      return Promise.resolve();
    }
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch (e) {}
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: CustomStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null as any;
