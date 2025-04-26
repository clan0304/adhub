// types/findwork.ts

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_time: string | null;
  created_at: string;
  profile_id: string;
  username: string;
  profile_photo: string | null;
  city: string;
  country: string;
  user_id: string;
  first_name: string;
  last_name: string;
  user_type: string;
  slug: string;
  is_saved?: boolean; // Flag to indicate if the job is saved by the current user
}

export interface CountryOption {
  code: string;
  name: string;
}
