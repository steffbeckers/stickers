import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

// With `web.output: "server"`, routes are rendered in Node (SSR) where there is no
// `window`. AsyncStorage's web build is backed by `window.localStorage`, so letting
// Supabase persist the session on the server throws `ReferenceError: window is not
// defined` and crashes the dev server. Only persist when a browser/native runtime is
// present; otherwise fall back to Supabase's in-memory adapter.
const isServer = typeof window === 'undefined';

// On web we sign in via redirect-based OAuth (signInWithOAuth), so supabase-js must
// parse the session out of the callback URL after Google redirects back. Native uses
// signInWithIdToken (no redirect), so detection stays off there.
const detectSessionInUrl = !isServer && Platform.OS === 'web';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    ...(isServer ? {} : { storage: AsyncStorage }),
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl,
  },
});
