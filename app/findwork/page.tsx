/* eslint-disable @typescript-eslint/no-explicit-any */
// app/findwork/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import JobPostingModal from '@/components/JobPostingModal';
import JobPostingCard from '@/components/JobPostingCard';
import { getData } from 'country-list';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface JobPosting {
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
}

interface CountryOption {
  code: string;
  name: string;
}

export default function FindWorkPage() {
  const { session } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allJobPostings, setAllJobPostings] = useState<JobPosting[]>([]);
  const [filteredJobPostings, setFilteredJobPostings] = useState<JobPosting[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load country list
  useEffect(() => {
    const countryData = getData();

    // Modify the list to ensure Taiwan is displayed correctly
    const modifiedCountries = countryData.map((country) => {
      if (country.code === 'TW') {
        return { ...country, name: 'Taiwan' };
      }
      return country;
    });

    // Sort countries alphabetically
    modifiedCountries.sort((a, b) => a.name.localeCompare(b.name));

    setCountries(modifiedCountries);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        setUserProfile(data);
      } catch (err: any) {
        console.error('Error fetching user profile:', err);
      }
    };

    if (session) {
      fetchUserProfile();
    }
  }, [session]);

  useEffect(() => {
    const fetchJobPostings = async () => {
      try {
        setLoading(true);

        // Fetch job postings with join to profiles
        const { data, error } = await supabase
          .from('job_postings')
          .select(
            `
            *,
            profiles!job_postings_profile_id_fkey (
              id,
              user_id,
              username,
              profile_photo,
              city,
              country,
              first_name,
              last_name,
              user_type
            )
          `
          )
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the nested data to match our expected format
        const transformedData = data.map((posting: any) => ({
          ...posting,
          profile_id: posting.profile_id,
          username: posting.profiles.username,
          profile_photo: posting.profiles.profile_photo,
          city: posting.profiles.city,
          country: posting.profiles.country,
          user_id: posting.profiles.user_id,
          first_name: posting.profiles.first_name,
          last_name: posting.profiles.last_name,
          user_type: posting.profiles.user_type,
        }));

        setAllJobPostings(transformedData || []);
        setFilteredJobPostings(transformedData || []);
      } catch (err: any) {
        console.error('Error fetching job postings:', err);
        setError(err.message || 'Failed to load job postings');
      } finally {
        setLoading(false);
      }
    };

    fetchJobPostings();
  }, []);

  // Apply filters when search or country changes
  useEffect(() => {
    if (!allJobPostings.length) return;

    let filtered = [...allJobPostings];

    // Apply country filter
    if (selectedCountry) {
      filtered = filtered.filter((job) => job.country === selectedCountry);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.city.toLowerCase().includes(query) ||
          `${job.first_name} ${job.last_name}`.toLowerCase().includes(query)
      );
    }

    setFilteredJobPostings(filtered);
  }, [selectedCountry, searchQuery, allJobPostings]);

  // Helper function to generate a slug from title
  const generateSlug = (title: string): string => {
    // Convert to lowercase, replace spaces with hyphens, remove special characters
    const baseSlug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');

    // Add random characters to ensure uniqueness
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${randomStr}`;
  };

  const handleCreateJobPosting = async (
    jobData: Omit<
      JobPosting,
      | 'id'
      | 'created_at'
      | 'profile_id'
      | 'username'
      | 'profile_photo'
      | 'city'
      | 'country'
      | 'user_id'
      | 'first_name'
      | 'last_name'
      | 'user_type'
      | 'slug'
    >
  ) => {
    if (!session?.user || !userProfile) return;

    try {
      // Generate slug from title
      const slug = generateSlug(jobData.title);

      // Use the profile's id column as the foreign key
      const { data, error } = await supabase
        .from('job_postings')
        .insert({
          profile_id: userProfile.id, // This uses the id from profiles table
          title: jobData.title,
          description: jobData.description,
          has_deadline: jobData.has_deadline,
          deadline_date: jobData.deadline_date,
          deadline_time: jobData.deadline_time,
          slug: slug,
        })
        .select();

      if (error) throw error;

      if (data && data[0]) {
        // Create a complete job posting object with profile data
        const newJobPosting = {
          ...data[0],
          username: userProfile.username,
          profile_photo: userProfile.profile_photo,
          city: userProfile.city,
          country: userProfile.country,
          user_id: userProfile.user_id,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          user_type: userProfile.user_type,
        };

        // Add the new job posting to the state
        const updatedJobPostings = [
          newJobPosting as JobPosting,
          ...allJobPostings,
        ];
        setAllJobPostings(updatedJobPostings);

        // Re-apply filters
        let filtered = [...updatedJobPostings];
        if (selectedCountry) {
          filtered = filtered.filter((job) => job.country === selectedCountry);
        }
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (job) =>
              job.title.toLowerCase().includes(query) ||
              job.description.toLowerCase().includes(query)
          );
        }
        setFilteredJobPostings(filtered);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error creating job posting:', err);
      alert(`Failed to create job posting: ${err.message}`);
    }
  };

  const handleDeleteJobPosting = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update both job posting lists
      const updatedJobPostings = allJobPostings.filter((job) => job.id !== id);
      setAllJobPostings(updatedJobPostings);
      setFilteredJobPostings(
        filteredJobPostings.filter((job) => job.id !== id)
      );
    } catch (err: any) {
      console.error('Error deleting job posting:', err);
      alert(`Failed to delete job posting: ${err.message}`);
    }
  };

  const clearFilters = () => {
    setSelectedCountry('');
    setSearchQuery('');
    setFilteredJobPostings(allJobPostings);
  };

  const isBusinessOwner = userProfile?.user_type === 'business_owner';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Find Work</h1>
            <p className="mt-2 text-lg text-gray-600">
              Discover collaboration opportunities with businesses
            </p>
          </div>

          {isBusinessOwner && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create Job Posting
            </button>
          )}
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search bar */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search job title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Country filter */}
            <div className="w-full md:w-64">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-9 px-3"
              >
                <option value="">All Countries</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters button - only show if filters are active */}
            {(selectedCountry || searchQuery) && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filter stats */}
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredJobPostings.length} of {allJobPostings.length} job
            postings
            {selectedCountry && ` in ${selectedCountry}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm underline"
            >
              Try again
            </button>
          </div>
        ) : filteredJobPostings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {allJobPostings.length === 0 ? (
              <>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No job postings yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isBusinessOwner
                    ? 'Get started by creating your first job posting.'
                    : 'Check back later for new opportunities.'}
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No matching job postings
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search filters to see more results.
                </p>
              </>
            )}
            {isBusinessOwner && allJobPostings.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  Create Job Posting
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobPostings.map((job) => (
              <JobPostingCard
                key={job.id}
                job={job}
                isOwner={job.user_id === session?.user?.id}
                onDelete={handleDeleteJobPosting}
              />
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <JobPostingModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateJobPosting}
        />
      )}
    </div>
  );
}
