// components/Navbar.tsx
'use client';

import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const Navbar = () => {
  const { session, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user initials for avatar
  const getInitials = () => {
    if (!session?.user) return '';

    const name = session.user.user_metadata?.name || '';
    if (name) {
      const nameParts = name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return name[0].toUpperCase();
    }

    // Fallback to email if name not available
    if (session.user.email) {
      return session.user.email[0].toUpperCase();
    }

    return '';
  };

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    router.push('/');
  };

  return (
    <nav className="flex justify-between items-center mx-auto px-4 py-5 max-w-7xl">
      <Link href="/">
        <div className="text-xl font-bold text-indigo-600">Your Logo</div>
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/creators">
          <div className="text-gray-700 hover:text-indigo-600 transition-colors">
            Creators
          </div>
        </Link>
        <Link href="/findwork">
          <div className="text-gray-700 hover:text-indigo-600 transition-colors cursor-pointer">
            Find Work
          </div>
        </Link>
        <Link href="/aboutus">
          <div className="text-gray-700 hover:text-indigo-600 transition-colors cursor-pointer">
            About Us
          </div>
        </Link>

        {session?.user ? (
          // User is logged in, show profile avatar
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 focus:outline-none hover:bg-indigo-200 transition-colors hover:cursor-pointer"
            >
              {session.user.user_metadata?.avatar_url ? (
                <Image
                  src={session.user.user_metadata.avatar_url}
                  alt="Profile"
                  className="rounded-full object-cover"
                  fill
                />
              ) : (
                <span className="font-medium">{getInitials()}</span>
              )}
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-68 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                  <p className="font-medium">
                    {session.user.user_metadata?.username}
                  </p>
                  <p className="text-gray-500 text-xs">{session.user.email}</p>
                </div>

                <Link href="/profile">
                  <div
                    className="block px-4 py-2 text-sm text-gray-700 font-semibold hover:bg-gray-100 cursor-pointer"
                    onClick={() => setMenuOpen(false)}
                  >
                    Your Profile
                  </div>
                </Link>

                <div
                  className="block px-4 py-2 text-sm text-white font-semibold bg-red-600 rounded-b-md hover:opacity-70 cursor-pointer"
                  onClick={handleSignOut}
                >
                  Sign out
                </div>
              </div>
            )}
          </div>
        ) : (
          // User is not logged in, show sign in button
          <Link href="/auth">
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
              Sign In
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
