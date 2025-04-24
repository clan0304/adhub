// contexts/ProfileSetupContext.tsx
'use client';

import { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export type UserType = 'content_creator' | 'business_owner';

export interface ProfileData {
  // Step 1
  userType: UserType | null;

  // Step 2
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  profilePhoto: File | null;
  profilePhotoUrl: string;
  city: string;
  country: string;

  // Additional fields for content creators
  instagramUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  isPublic: boolean;
  openToCollaborate: boolean;
}

interface ProfileSetupContextProps {
  currentStep: number;
  profileData: ProfileData;
  loading: boolean;
  error: string | null;
  updateProfileData: (data: Partial<ProfileData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  submitProfile: () => Promise<void>;
  setProfilePhoto: (file: File) => void;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  checkPhoneAvailability: (phone: string) => Promise<boolean>;
}

const initialProfileData: ProfileData = {
  userType: null,
  username: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  profilePhoto: null,
  profilePhotoUrl: '',
  city: '',
  country: '',
  instagramUrl: '',
  youtubeUrl: '',
  tiktokUrl: '',
  isPublic: true,
  openToCollaborate: false,
};

const ProfileSetupContext = createContext<ProfileSetupContextProps | undefined>(
  undefined
);

export function ProfileSetupProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileData, setProfileData] =
    useState<ProfileData>(initialProfileData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const router = useRouter();

  const updateProfileData = (data: Partial<ProfileData>) => {
    setProfileData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const setProfilePhoto = (file: File) => {
    const photoUrl = URL.createObjectURL(file);
    setProfileData((prev) => ({
      ...prev,
      profilePhoto: file,
      profilePhotoUrl: photoUrl,
    }));
  };

  const checkUsernameAvailability = async (
    username: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        // PGRST116 means no rows returned, meaning username is available
        return true;
      }

      return false; // Username exists
    } catch (err) {
      console.error('Error checking username:', err);
      return false;
    }
  };

  const checkPhoneAvailability = async (phone: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('phone_number')
        .eq('phone_number', phone)
        .single();

      if (error && error.code === 'PGRST116') {
        // PGRST116 means no rows returned, meaning phone is available
        return true;
      }

      return false; // Phone exists
    } catch (err) {
      console.error('Error checking phone:', err);
      return false;
    }
  };

  const submitProfile = async () => {
    if (!session?.user) {
      setError('You must be logged in to complete your profile');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let profilePhotoPath = null;

      // Upload profile photo if present
      if (profileData.profilePhoto) {
        const fileExt = profileData.profilePhoto.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}`;
        const filePath = `${session.user.id}/${fileName}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, profileData.profilePhoto);

        if (uploadError) {
          throw new Error(
            `Error uploading profile photo: ${uploadError.message}`
          );
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);

        profilePhotoPath = publicUrlData.publicUrl;
      }

      // Create profile record
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: session.user.id,
        user_type: profileData.userType,
        username: profileData.username,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone_number: profileData.phoneNumber,
        profile_photo: profilePhotoPath,
        city: profileData.city,
        country: profileData.country,
        instagram_url: profileData.instagramUrl,
        youtube_url: profileData.youtubeUrl,
        tiktok_url: profileData.tiktokUrl,
        is_public: profileData.isPublic,
        open_to_collaborate: profileData.openToCollaborate,
        created_at: new Date(),
        updated_at: new Date(),
      });

      if (profileError) {
        throw new Error(`Error creating profile: ${profileError.message}`);
      }

      // Update user metadata with basic profile info
      await supabase.auth.updateUser({
        data: {
          user_type: profileData.userType,
          username: profileData.username,
          profile_completed: true,
        },
      });

      // Redirect to dashboard on success
      router.push('/');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      console.error('Error submitting profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileSetupContext.Provider
      value={{
        currentStep,
        profileData,
        loading,
        error,
        updateProfileData,
        nextStep,
        prevStep,
        submitProfile,
        setProfilePhoto,
        checkUsernameAvailability,
        checkPhoneAvailability,
      }}
    >
      {children}
    </ProfileSetupContext.Provider>
  );
}

export const useProfileSetup = () => {
  const context = useContext(ProfileSetupContext);
  if (context === undefined) {
    throw new Error(
      'useProfileSetup must be used within a ProfileSetupProvider'
    );
  }
  return context;
};
