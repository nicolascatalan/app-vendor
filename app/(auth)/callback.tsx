import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// OAuth callback handler — expo-auth-session handles this automatically via deep link
// This screen is a fallback in case the deep link lands here
export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/(tabs)');
  }, []);
  return null;
}
