/* eslint-disable @typescript-eslint/no-explicit-any */
// app/findwork/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import JobPostingModal, {
  JobPostingFormData,
} from '@/components/JobPostingModal';
import { JobPostingsList } from '@/components/findwork/JobPostingList';
import { FilterSection } from '@/components/findwork/FilterSection';
import { JobPosting, CountryOption } from '@/types/findwork';
import { getData } from 'country-list';

export default function FindWorkPage() {
  const { session } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allJobPostings, setAllJobPostings] = useState<JobPosting[]>([]);
  const [filteredJobPostings, setFilteredJobPostings] = useState<JobPosting[]>(
    []
  );
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlySaved, setShowOnlySaved] = useState(false);
  const [showMyPostingsOnly, setShowMyPostingsOnly] = useState(false);
  const [currentEditJob, setCurrentEditJob] = useState<JobPosting | null>(null);

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

  // Fetch user profile and check if user is a content creator
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
        console.error('Error fetching profile:', err);
      }
    };

    fetchUserProfile();
  }, [session]);

  // Fetch job postings and saved jobs
  useEffect(() => {
    const fetchJobPostings = async () => {
      try {
        setLoading(true);

        // Fetch all job postings
        const { data: jobsData, error: jobsError } = await supabase
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

        if (jobsError) throw jobsError;

        // Transform the nested data
        const transformedJobs = jobsData.map((posting: any) => ({
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
          is_saved: false, // Default to not saved
        }));

        setAllJobPostings(transformedJobs);
        setFilteredJobPostings(transformedJobs);

        // If user is logged in and is a content creator, fetch their saved jobs
        if (session?.user && userProfile?.user_type === 'content_creator') {
          const { data: savedJobsData, error: savedJobsError } = await supabase
            .from('saved_jobs')
            .select('job_posting_id')
            .eq('profile_id', userProfile.id);

          if (savedJobsError) throw savedJobsError;

          // Create a Set of saved job IDs for efficient lookup
          const savedIds = new Set(
            savedJobsData.map((item) => item.job_posting_id)
          );
          setSavedJobIds(savedIds);

          // Mark jobs as saved
          const jobsWithSavedFlag = transformedJobs.map((job) => ({
            ...job,
            is_saved: savedIds.has(job.id),
          }));

          setAllJobPostings(jobsWithSavedFlag);
          setFilteredJobPostings(jobsWithSavedFlag);
        }
      } catch (err: any) {
        console.error('Error fetching job postings:', err);
        setError(err.message || 'Failed to load job postings');
      } finally {
        setLoading(false);
      }
    };

    fetchJobPostings();
  }, [session, userProfile]);

  // Apply filters when search, country, saved filter, or my postings filter changes
  useEffect(() => {
    if (!allJobPostings.length) return;

    let filtered = [...allJobPostings];

    // Apply saved jobs filter
    if (showOnlySaved) {
      filtered = filtered.filter((job) => job.is_saved);
    }

    // Apply my postings filter for business owners
    if (showMyPostingsOnly && session?.user) {
      filtered = filtered.filter((job) => job.user_id === session.user?.id);
    }

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
  }, [
    selectedCountry,
    searchQuery,
    showOnlySaved,
    showMyPostingsOnly,
    allJobPostings,
    session,
  ]);

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

  const handleCreateJobPosting = async (jobData: JobPostingFormData) => {
    if (!session?.user || !userProfile) return;

    try {
      if (currentEditJob) {
        // Update existing job posting
        const { error } = await supabase
          .from('job_postings')
          .update({
            title: jobData.title,
            description: jobData.description,
            has_deadline: jobData.has_deadline,
            deadline_date: jobData.deadline_date,
            deadline_time: jobData.deadline_time,
          })
          .eq('id', currentEditJob.id);

        if (error) throw error;

        // Update job listings in state
        const updatedJobPostings = allJobPostings.map((job) =>
          job.id === currentEditJob.id
            ? {
                ...job,
                title: jobData.title,
                description: jobData.description,
                has_deadline: jobData.has_deadline,
                deadline_date: jobData.deadline_date,
                deadline_time: jobData.deadline_time,
              }
            : job
        );

        setAllJobPostings(updatedJobPostings);
        setFilteredJobPostings(
          filteredJobPostings.map((job) =>
            job.id === currentEditJob.id
              ? {
                  ...job,
                  title: jobData.title,
                  description: jobData.description,
                  has_deadline: jobData.has_deadline,
                  deadline_date: jobData.deadline_date,
                  deadline_time: jobData.deadline_time,
                }
              : job
          )
        );
      } else {
        // Create new job posting
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
            is_saved: false,
          };

          // Add the new job posting to the state
          const updatedJobPostings = [
            newJobPosting as JobPosting,
            ...allJobPostings,
          ];
          setAllJobPostings(updatedJobPostings);

          // Re-apply filters
          let filtered = [...updatedJobPostings];
          if (showOnlySaved) {
            filtered = filtered.filter((job) => job.is_saved);
          }
          if (showMyPostingsOnly && session?.user) {
            filtered = filtered.filter(
              (job) => job.user_id === session.user?.id
            );
          }
          if (selectedCountry) {
            filtered = filtered.filter(
              (job) => job.country === selectedCountry
            );
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
      }

      setIsModalOpen(false);
      setCurrentEditJob(null);
    } catch (err: any) {
      console.error('Error creating/updating job posting:', err);
      alert(
        `Failed to ${currentEditJob ? 'update' : 'create'} job posting: ${
          err.message
        }`
      );
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

  const handleEditJobPosting = (job: JobPosting) => {
    setCurrentEditJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentEditJob(null);
  };

  const handleSaveJob = async (jobId: string, isSaved: boolean) => {
    if (!userProfile) return;

    try {
      if (isSaved) {
        // Unsave the job
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('profile_id', userProfile.id)
          .eq('job_posting_id', jobId);

        if (error) throw error;

        // Update saved jobs set
        const newSavedIds = new Set(savedJobIds);
        newSavedIds.delete(jobId);
        setSavedJobIds(newSavedIds);

        // Update job postings
        const updatedAll = allJobPostings.map((job) =>
          job.id === jobId ? { ...job, is_saved: false } : job
        );
        setAllJobPostings(updatedAll);

        // Update filtered job postings
        setFilteredJobPostings((prevFiltered) => {
          // If we're showing only saved, remove this job from the filtered list
          if (showOnlySaved) {
            return prevFiltered.filter((job) => job.id !== jobId);
          }
          // Otherwise, update it to show as not saved
          return prevFiltered.map((job) =>
            job.id === jobId ? { ...job, is_saved: false } : job
          );
        });
      } else {
        // Save the job
        const { error } = await supabase.from('saved_jobs').insert({
          profile_id: userProfile.id,
          job_posting_id: jobId,
        });

        if (error) throw error;

        // Update saved jobs set
        const newSavedIds = new Set(savedJobIds);
        newSavedIds.add(jobId);
        setSavedJobIds(newSavedIds);

        // Update job postings
        const updatedAll = allJobPostings.map((job) =>
          job.id === jobId ? { ...job, is_saved: true } : job
        );
        setAllJobPostings(updatedAll);

        // Update filtered job postings
        setFilteredJobPostings((prevFiltered) =>
          prevFiltered.map((job) =>
            job.id === jobId ? { ...job, is_saved: true } : job
          )
        );
      }
    } catch (err: any) {
      console.error('Error saving/unsaving job:', err);
      alert(`Failed to save/unsave job: ${err.message}`);
    }
  };

  const clearFilters = () => {
    setSelectedCountry('');
    setSearchQuery('');
    setShowOnlySaved(false);
    setShowMyPostingsOnly(false);
    setFilteredJobPostings(allJobPostings);
  };

  const toggleSavedFilter = () => {
    setShowOnlySaved(!showOnlySaved);
    // Turn off "My Postings" filter if turning on "Saved" filter
    if (!showOnlySaved) {
      setShowMyPostingsOnly(false);
    }
  };

  const toggleMyPostingsFilter = () => {
    setShowMyPostingsOnly(!showMyPostingsOnly);
    // Turn off "Saved" filter if turning on "My Postings" filter
    if (!showMyPostingsOnly) {
      setShowOnlySaved(false);
    }
  };

  const isBusinessOwner = userProfile?.user_type === 'business_owner';
  const isContentCreator = userProfile?.user_type === 'content_creator';

  // Count how many postings are created by the business owner
  const myPostingsCount = session?.user
    ? allJobPostings.filter((job) => job.user_id === session.user?.id).length
    : 0;

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
              onClick={() => {
                setCurrentEditJob(null); // Ensure we're creating a new job
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create Job Posting
            </button>
          )}
        </div>

        <FilterSection
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          countries={countries}
          showOnlySaved={showOnlySaved}
          toggleSavedFilter={toggleSavedFilter}
          showMyPostingsOnly={showMyPostingsOnly}
          toggleMyPostingsFilter={toggleMyPostingsFilter}
          clearFilters={clearFilters}
          isContentCreator={isContentCreator}
          isBusinessOwner={isBusinessOwner}
          myPostingsCount={myPostingsCount}
          filteredCount={filteredJobPostings.length}
          totalCount={allJobPostings.length}
        />

        <JobPostingsList
          loading={loading}
          error={error}
          filteredJobPostings={filteredJobPostings}
          allJobPostings={allJobPostings}
          session={session}
          isBusinessOwner={isBusinessOwner}
          showMyPostingsOnly={showMyPostingsOnly}
          myPostingsCount={myPostingsCount}
          setIsModalOpen={setIsModalOpen}
          handleDeleteJobPosting={handleDeleteJobPosting}
          handleSaveJob={handleSaveJob}
          handleEditJobPosting={handleEditJobPosting}
        />
      </div>

      {isModalOpen && (
        <JobPostingModal
          onClose={handleCloseModal}
          onCreate={handleCreateJobPosting}
          initialData={currentEditJob}
        />
      )}
    </div>
  );
}
