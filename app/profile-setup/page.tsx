// app/profile-setup/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileSetupProvider } from '@/contexts/ProfileSetupContext';
import ProfileSetupForm from '@/components/ProfileSetupForm';

export default function ProfileSetup() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is not authenticated, redirect to auth page
    if (!loading && !session) {
      router.push('/auth');
      return;
    }

    // Check if profile is already completed (from user metadata)
    const isProfileCompleted = session?.user?.user_metadata?.profile_completed;
    if (isProfileCompleted) {
      router.push('/');
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect from useEffect
  }

  return (
    <ProfileSetupProvider>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <h1 className="text-2xl font-bold text-center mb-8">
              Complete Your Profile
            </h1>
            <ProfileSetupForm />
          </div>
        </div>
      </div>
    </ProfileSetupProvider>
  );
}
