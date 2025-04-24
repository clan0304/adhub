/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type for user session
export type UserSession = {
  user: {
    id: string;
    email?: string;
    user_metadata: {
      name?: string;
      avatar_url?: string;
      user_type?: 'content_creator' | 'business_owner';
      username?: string;
      profile_completed?: boolean;
    };
  } | null;
  session: any | null;
};
