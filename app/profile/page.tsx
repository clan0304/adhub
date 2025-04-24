/* eslint-disable @typescript-eslint/no-explicit-any */
// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { getData } from 'country-list';
import Image from 'next/image';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_photo: string | null;
  city: string;
  country: string;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  is_public: boolean;
  open_to_collaborate: boolean;
  user_type: 'content_creator' | 'business_owner';
}

export default function ProfilePage() {
  const { session, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countries, setCountries] = useState<{ code: string; name: string }[]>(
    []
  );
  const router = useRouter();

  // Load countries for the dropdown
  useEffect(() => {
    const countryData = getData();

    // Create a modified list with Taiwan correction
    const modifiedCountries = countryData.map((country) => {
      // Change "Taiwan, Province of China" to "Taiwan"
      if (country.code === 'TW') {
        return { ...country, name: 'Taiwan' };
      }
      return country;
    });

    // Sort by name
    modifiedCountries.sort((a, b) => a.name.localeCompare(b.name));

    setCountries(modifiedCountries);
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching profile for user:', session.user.id);

        // Get profile from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          if (error.code === 'PGRST116') {
            // No rows found
            router.push('/profile-setup');
            return;
          }
          throw error;
        }

        if (data) {
          console.log('Profile fetched successfully:', data);
          setProfile(data as UserProfile);
          setEditedProfile(data as UserProfile);
        } else {
          // Profile not found, redirect to profile setup
          console.log('No profile found, redirecting to setup');
          router.push('/profile-setup');
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && session) {
      fetchProfile();
    } else if (!authLoading && !session) {
      router.push('/auth');
    }
  }, [session, authLoading, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setEditedProfile({
        ...editedProfile,
        [name]: checkbox.checked,
      });
    } else {
      setEditedProfile({
        ...editedProfile,
        [name]: value,
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !session) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('Saving profile changes:', editedProfile);

      const { error } = await supabase
        .from('profiles')
        .update({
          username: editedProfile.username,
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          phone_number: editedProfile.phone_number,
          city: editedProfile.city,
          country: editedProfile.country,
          instagram_url: editedProfile.instagram_url || null,
          youtube_url: editedProfile.youtube_url || null,
          tiktok_url: editedProfile.tiktok_url || null,
          is_public: editedProfile.is_public,
          open_to_collaborate: editedProfile.open_to_collaborate,
        })
        .eq('user_id', session.user?.id);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      console.log('Profile updated successfully');

      // Update the profile state with the edited values
      setProfile(editedProfile as UserProfile);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');

      // If username changed, update in auth metadata
      if (profile.username !== editedProfile.username) {
        console.log('Updating username in auth metadata');
        const { error: authError } = await supabase.auth.updateUser({
          data: { username: editedProfile.username },
        });

        if (authError) {
          console.error('Error updating auth metadata:', authError);
        }
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset edited profile to current profile values
    setEditedProfile(profile as UserProfile);
    setIsEditing(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect from useEffect
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-indigo-600 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null; // Will redirect to profile setup
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8 border-b">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                <p>{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
                <p>{successMessage}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 mx-auto sm:mx-0">
                {profile.profile_photo ? (
                  <Image
                    src={profile.profile_photo}
                    alt={profile.username}
                    height={60}
                    width={60}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                    <span className="text-3xl font-bold">
                      {profile.first_name.charAt(0)}
                      {profile.last_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-gray-500 mb-2">@{profile.username}</p>
                <div className="mb-2">
                  <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2">
                    {profile.user_type === 'content_creator'
                      ? 'Content Creator'
                      : 'Business Owner'}
                  </span>
                  {profile.is_public && (
                    <span className="inline-block bg-green-100 rounded-full px-3 py-1 text-sm font-semibold text-green-700">
                      Public Profile
                    </span>
                  )}
                </div>
                <p className="text-gray-600">
                  {profile.city}, {profile.country}
                </p>
              </div>
            </div>
          </div>

          {isEditing ? (
            // Edit form
            <div className="p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Username*
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={editedProfile.username || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="phone_number"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number*
                  </label>
                  <input
                    type="text"
                    name="phone_number"
                    id="phone_number"
                    value={editedProfile.phone_number || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First Name*
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    value={editedProfile.first_name || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last Name*
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    value={editedProfile.last_name || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700"
                  >
                    City*
                  </label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    value={editedProfile.city || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Country*
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={editedProfile.country || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="" disabled>
                      Select a country
                    </option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {profile.user_type === 'content_creator' && (
                  <>
                    <div className="sm:col-span-6">
                      <h3 className="text-lg font-medium mb-2">Social Media</h3>
                    </div>

                    <div className="sm:col-span-6">
                      <label
                        htmlFor="instagram_url"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Instagram URL
                      </label>
                      <input
                        type="url"
                        name="instagram_url"
                        id="instagram_url"
                        value={editedProfile.instagram_url || ''}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/username"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label
                        htmlFor="youtube_url"
                        className="block text-sm font-medium text-gray-700"
                      >
                        YouTube URL
                      </label>
                      <input
                        type="url"
                        name="youtube_url"
                        id="youtube_url"
                        value={editedProfile.youtube_url || ''}
                        onChange={handleInputChange}
                        placeholder="https://youtube.com/c/username"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <label
                        htmlFor="tiktok_url"
                        className="block text-sm font-medium text-gray-700"
                      >
                        TikTok URL
                      </label>
                      <input
                        type="url"
                        name="tiktok_url"
                        id="tiktok_url"
                        value={editedProfile.tiktok_url || ''}
                        onChange={handleInputChange}
                        placeholder="https://tiktok.com/@username"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <div className="flex items-center">
                        <input
                          id="is_public"
                          name="is_public"
                          type="checkbox"
                          checked={editedProfile.is_public || false}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor="is_public"
                          className="ml-2 block text-sm text-gray-900"
                        >
                          Make my profile public (visible to others)
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <div className="flex items-center">
                        <input
                          id="open_to_collaborate"
                          name="open_to_collaborate"
                          type="checkbox"
                          checked={editedProfile.open_to_collaborate || false}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label
                          htmlFor="open_to_collaborate"
                          className="ml-2 block text-sm text-gray-900"
                        >
                          I&apos;m open to collaborations
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Display profile
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p>{session.user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p>{profile.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p>
                        {profile.city}, {profile.country}
                      </p>
                    </div>
                  </div>
                </div>

                {profile.user_type === 'content_creator' && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Social Media</h3>
                    <div className="space-y-3">
                      {profile.instagram_url ? (
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 mr-2 text-pink-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                          <a
                            href={profile.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            Instagram
                          </a>
                        </div>
                      ) : null}

                      {profile.youtube_url ? (
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 mr-2 text-red-600"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                          </svg>
                          <a
                            href={profile.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            YouTube
                          </a>
                        </div>
                      ) : null}

                      {profile.tiktok_url ? (
                        <div className="flex items-center">
                          <svg
                            className="h-5 w-5 mr-2"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                          </svg>
                          <a
                            href={profile.tiktok_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                          >
                            TikTok
                          </a>
                        </div>
                      ) : null}

                      {!profile.instagram_url &&
                        !profile.youtube_url &&
                        !profile.tiktok_url && (
                          <p className="text-gray-500">
                            No social media profiles added
                          </p>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {profile.user_type === 'content_creator' && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-4">Profile Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Public Profile</p>
                        <p className="text-sm text-gray-500">
                          Make your profile visible to others and appear in
                          creators list
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full ${
                          profile.is_public
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {profile.is_public ? 'Public' : 'Private'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Open to Collaborations</p>
                        <p className="text-sm text-gray-500">
                          Allow businesses to contact you for potential
                          collaborations
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full ${
                          profile.open_to_collaborate
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {profile.open_to_collaborate
                          ? 'Available'
                          : 'Unavailable'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {profile.user_type === 'content_creator' && profile.is_public && (
                <div className="mt-6">
                  <a
                    href={`/creators/${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    View your public profile
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
