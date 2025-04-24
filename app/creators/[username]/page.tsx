// app/creators/[username]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Creator {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  city: string;
  country: string;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  open_to_collaborate: boolean;
}

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        // Fetch the creator by username
        const { data, error } = await supabase
          .from('content_creators')
          .select('*')
          .eq('username', username)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // PGRST116 means no rows returned
            throw new Error('Creator not found');
          }
          throw error;
        }

        setCreator(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Error fetching creator:', err);
        setError(err.message || 'Failed to load creator profile');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchCreator();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Profile Not Found</h2>
            <p>
              {error ||
                'This creator does not exist or their profile is private.'}
            </p>
            <Link
              href="/creators"
              className="mt-4 inline-block text-indigo-600 underline"
            >
              Back to creators
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header with back button */}
          <div className="p-4 bg-gray-50 border-b">
            <Link href="/creators">
              <button className="flex items-center text-gray-600 hover:text-gray-900">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  ></path>
                </svg>
                Back to creators
              </button>
            </Link>
          </div>

          {/* Creator header */}
          <div className="p-8 border-b">
            <div className="flex flex-col sm:flex-row items-center">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 mb-4 sm:mb-0 sm:mr-6">
                {creator.profile_photo ? (
                  <Image
                    src={creator.profile_photo}
                    alt={creator.username}
                    className="h-full w-full object-cover"
                    width={60}
                    height={60}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                    <span className="text-3xl font-bold">
                      {creator.first_name.charAt(0)}
                      {creator.last_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900">
                  {creator.first_name} {creator.last_name}
                </h1>
                <p className="text-lg text-gray-500 mb-2">
                  @{creator.username}
                </p>
                <p className="text-gray-600 mb-4">
                  {creator.city}, {creator.country}
                </p>

                {creator.open_to_collaborate && (
                  <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full inline-block">
                    Open to collaborate
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social links */}
          <div className="p-8 border-b">
            <h2 className="text-xl font-semibold mb-4">
              Connect With {creator.first_name}
            </h2>
            <div className="flex flex-wrap gap-4">
              {creator.instagram_url && (
                <a
                  href={creator.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  Instagram
                </a>
              )}

              {creator.youtube_url && (
                <a
                  href={creator.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                  YouTube
                </a>
              )}

              {creator.tiktok_url && (
                <a
                  href={creator.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center bg-black text-white px-4 py-2 rounded-md"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                  TikTok
                </a>
              )}

              {!creator.instagram_url &&
                !creator.youtube_url &&
                !creator.tiktok_url && (
                  <p className="text-gray-500">
                    No social media profiles available.
                  </p>
                )}
            </div>
          </div>

          {/* Contact section */}
          <div className="p-8">
            <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
            {creator.open_to_collaborate ? (
              <div>
                <p className="text-gray-600 mb-4">
                  {creator.first_name} is open to collaborations! Send a message
                  to start a conversation.
                </p>
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                  Contact {creator.first_name}
                </button>
              </div>
            ) : (
              <p className="text-gray-600">
                {creator.first_name} is not currently open to new
                collaborations.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
