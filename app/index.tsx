/**
 * App Entry Point — Smart redirect to appropriate dashboard
 * Routes: auth screens, user dashboard, admin dashboard
 */

import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { LoadingSpinner } from '../src/components/ui/LoadingSpinner';

export default function Index() {
  const { isAuthenticated, isProfileComplete, role, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading TiffinFlow..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/splash" />;
  }

  if (!isProfileComplete) {
    return <Redirect href="/(auth)/profile-setup" />;
  }

  if (role === 'admin') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return <Redirect href="/(user)/home" />;
}
