/* eslint-disable @typescript-eslint/no-explicit-any */
// app/findwork/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookmarkIcon, BookmarkFilledIcon } from '@radix-ui/react-icons';
import { Loader2 } from 'lucide-react';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_time: string | null;
  created_at: string;
  profile_id: string;
  slug: string;
  user_id: string;
  username: string;
  profile_photo: string | null;
  city: string;
  country: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

interface Applicant {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  city: string;
  country: string;
  created_at: string;
}

export default function JobPostingDetailPage() {
  const { slug } = useParams();
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [showApplicants, setShowApplicants] = useState(false);
  const { session } = useAuth();
  const router = useRouter();

  // Fetch job posting, user profile, and check saved/applied status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch job posting by slug with join to profiles
        const { data: jobData, error: jobError } = await supabase
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
          .eq('slug', slug)
          .single();

        if (jobError) {
          throw jobError;
        }

        if (jobData) {
          // Transform the nested data
          const transformedJob = {
            ...jobData,
            user_id: jobData.profiles.user_id,
            username: jobData.profiles.username,
            profile_photo: jobData.profiles.profile_photo,
            city: jobData.profiles.city,
            country: jobData.profiles.country,
            first_name: jobData.profiles.first_name,
            last_name: jobData.profiles.last_name,
            user_type: jobData.profiles.user_type,
          };

          setJobPosting(transformedJob as JobPosting);

          // If user is logged in, get their profile and check if they saved/applied
          if (session?.user?.id) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (profileError) {
              console.error('Error fetching profile:', profileError);
            } else {
              setUserProfile(profileData);

              // Check if job is saved
              const { data: savedData } = await supabase
                .from('saved_jobs')
                .select('*')
                .eq('profile_id', profileData.id)
                .eq('job_posting_id', jobData.id)
                .single();

              setIsSaved(!!savedData);

              // Check if user has applied for this job
              const { data: appliedData } = await supabase
                .from('job_applications')
                .select('*')
                .eq('profile_id', profileData.id)
                .eq('job_posting_id', jobData.id)
                .single();

              setIsApplied(!!appliedData);

              // If the user is the job owner, fetch applicants
              if (jobData.profiles.user_id === session.user.id) {
                const { data: applicantsData, error: applicantsError } =
                  await supabase
                    .from('job_applications')
                    .select(
                      `
                    id,
                    created_at,
                    profiles:profile_id(
                      id,
                      username,
                      first_name,
                      last_name,
                      profile_photo,
                      city,
                      country
                    )
                  `
                    )
                    .eq('job_posting_id', jobData.id)
                    .order('created_at', { ascending: false });

                if (applicantsError) {
                  console.error('Error fetching applicants:', applicantsError);
                } else if (applicantsData && applicantsData.length > 0) {
                  // Log the shape of the data to console for debugging
                  console.log(
                    'Applicants data structure:',
                    JSON.stringify(applicantsData[0], null, 2)
                  );

                  // Transform the applicant data with proper type handling
                  const transformedApplicants: Applicant[] = [];

                  for (const item of applicantsData) {
                    // Handle both cases: profiles as object or as array
                    const profileData = Array.isArray(item.profiles)
                      ? item.profiles[0] // If it's an array, take the first item
                      : item.profiles; // If it's an object, use it directly

                    // If profile data is missing or null, skip this item
                    if (!profileData) {
                      console.error(
                        'Missing profile data for application:',
                        item.id
                      );
                      continue;
                    }

                    transformedApplicants.push({
                      id: profileData.id,
                      username: profileData.username,
                      first_name: profileData.first_name,
                      last_name: profileData.last_name,
                      profile_photo: profileData.profile_photo,
                      city: profileData.city,
                      country: profileData.country,
                      created_at: item.created_at,
                    });
                  }

                  setApplicants(transformedApplicants);
                }
              }
            }
          }
        } else {
          setError('Job posting not found');
        }
      } catch (err: any) {
        console.error('Error fetching job posting:', err);
        setError(err.message || 'Failed to load job posting');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug, session]);

  // Handle save/unsave job
  const handleSaveJob = async () => {
    if (!session?.user?.id || !userProfile || !jobPosting) return;

    setIsActionLoading(true);

    try {
      if (isSaved) {
        // Unsave the job
        const { error } = await supabase
          .from('saved_jobs')
          .delete()
          .eq('profile_id', userProfile.id)
          .eq('job_posting_id', jobPosting.id);

        if (error) throw error;
        setIsSaved(false);
      } else {
        // Save the job
        const { error } = await supabase.from('saved_jobs').insert({
          profile_id: userProfile.id,
          job_posting_id: jobPosting.id,
        });

        if (error) throw error;
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error saving/unsaving job:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle apply for job
  const handleApplyForJob = async () => {
    if (!session?.user?.id || !userProfile || !jobPosting) return;

    setIsActionLoading(true);

    try {
      // Create job application
      const { error } = await supabase.from('job_applications').insert({
        profile_id: userProfile.id,
        job_posting_id: jobPosting.id,
      });

      if (error) throw error;

      setIsApplied(true);
    } catch (err) {
      console.error('Error applying for job:', err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Format date functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatDeadline = (
    dateString: string | null,
    timeString: string | null
  ) => {
    if (!dateString) return 'No deadline';

    const date = new Date(dateString);
    let formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);

    if (timeString) {
      formattedDate += ` at ${timeString}`;
    }

    return formattedDate;
  };

  // Check if deadline has passed
  const isDeadlinePassed = () => {
    if (!jobPosting?.has_deadline || !jobPosting?.deadline_date) return false;

    const today = new Date();
    const deadline = new Date(jobPosting.deadline_date);

    if (jobPosting.deadline_time) {
      const [hours, minutes] = jobPosting.deadline_time.split(':').map(Number);
      deadline.setHours(hours, minutes);
    } else {
      deadline.setHours(23, 59, 59);
    }

    return today > deadline;
  };

  // Check if the current user is the owner of this job posting
  const isOwner = session?.user && jobPosting?.user_id === session.user.id;

  // Check if the current user is a content creator (can apply/save)
  const isContentCreator = userProfile?.user_type === 'content_creator';

  const handleDelete = async () => {
    if (!isOwner || !jobPosting) return;

    const confirmed = confirm(
      'Are you sure you want to delete this job posting?'
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobPosting.id);

      if (error) throw error;

      // Redirect back to listings page
      router.push('/findwork');
    } catch (err: any) {
      console.error('Error deleting job posting:', err);
      setError(err.message || 'Failed to delete job posting');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !jobPosting) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error || 'Job posting not found'}</p>
          <Link href="/findwork">
            <Button variant="outline" className="mt-4">
              Back to Listings
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <Link href="/findwork">
          <Button variant="outline" className="mb-6 hover:cursor-pointer">
            ← Back to Listings
          </Button>
        </Link>

        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">{jobPosting.title}</h1>

          {/* Save button for content creators */}
          {isContentCreator && !isOwner && (
            <button
              onClick={handleSaveJob}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none transition-colors"
              disabled={isActionLoading}
              aria-label={isSaved ? 'Unsave job' : 'Save job'}
            >
              {isActionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              ) : isSaved ? (
                <BookmarkFilledIcon className="h-5 w-5 text-indigo-600" />
              ) : (
                <BookmarkIcon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          )}
        </div>

        <div className="flex items-center mt-4">
          <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            {jobPosting.profile_photo ? (
              <Image
                src={jobPosting.profile_photo}
                alt={jobPosting.username}
                width={60}
                height={60}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                <span className="font-bold">
                  {jobPosting.first_name.charAt(0)}
                  {jobPosting.last_name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <p className="font-medium">{jobPosting.username}</p>
            <p className="text-sm text-gray-500">
              Posted on {formatDate(jobPosting.created_at)}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Located in {jobPosting.city}, {jobPosting.country}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {jobPosting.has_deadline && (
              <div
                className={`${
                  isDeadlinePassed() ? 'text-red-600' : 'text-indigo-600'
                } p-4 rounded-lg ${
                  isDeadlinePassed() ? 'bg-red-50' : 'bg-indigo-50'
                }`}
              >
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span className="font-medium">Deadline:</span>
                  <span className="ml-2">
                    {formatDeadline(
                      jobPosting.deadline_date,
                      jobPosting.deadline_time
                    )}
                  </span>
                </div>
                {isDeadlinePassed() && (
                  <p className="mt-2 text-sm">This job posting has expired.</p>
                )}
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <div className="prose max-w-none">
                {/* Split description into paragraphs */}
                {jobPosting.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">About the Business</h3>
              <Link
                href={`/creators/${jobPosting.username}`}
                className="text-indigo-600 hover:underline"
              >
                View {jobPosting.first_name}&apos;s profile
              </Link>
            </div>

            {/* Show applicants list for business owners */}
            {isOwner && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4">Applicants</h3>
                {applicants.length === 0 ? (
                  <p className="text-gray-500">
                    No one has applied for this job posting yet.
                  </p>
                ) : (
                  <>
                    <p className="text-gray-700 mb-4">
                      {applicants.length}{' '}
                      {applicants.length === 1 ? 'person has' : 'people have'}{' '}
                      applied for this job.
                    </p>

                    <Button
                      onClick={() => setShowApplicants(!showApplicants)}
                      variant="outline"
                      className="mb-4"
                    >
                      {showApplicants ? 'Hide Applicants' : 'View Applicants'}
                    </Button>

                    {showApplicants && (
                      <div className="space-y-4 mt-4">
                        {applicants.map((applicant) => (
                          <div
                            key={applicant.id}
                            className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                              {applicant.profile_photo ? (
                                <Image
                                  src={applicant.profile_photo}
                                  alt={applicant.username}
                                  width={48}
                                  height={48}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                                  <span className="font-bold">
                                    {applicant.first_name.charAt(0)}
                                    {applicant.last_name.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex-grow">
                              <h4 className="font-medium">
                                {applicant.first_name} {applicant.last_name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                @{applicant.username} • {applicant.city},{' '}
                                {applicant.country}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Applied on {formatDate(applicant.created_at)}
                              </p>
                            </div>
                            <Link
                              href={`/creators/${applicant.username}`}
                              className="text-indigo-600 hover:underline text-sm"
                            >
                              View Profile
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isOwner ? (
            <div className="flex gap-4">
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete Job Posting
              </Button>
            </div>
          ) : isContentCreator ? (
            <>
              {isApplied ? (
                <div className="flex items-center text-green-700 font-medium">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  You&apos;ve applied for this job
                </div>
              ) : (
                <Button
                  onClick={handleApplyForJob}
                  disabled={isActionLoading || isDeadlinePassed()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isActionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying...
                    </>
                  ) : isDeadlinePassed() ? (
                    'Deadline Passed'
                  ) : (
                    'Apply for this Job'
                  )}
                </Button>
              )}
            </>
          ) : (
            <div className="text-gray-500">
              {session ? (
                'Only content creators can apply for jobs'
              ) : (
                <Link href={`/auth?redirectTo=/findwork/${slug}`}>
                  <Button>Sign in to apply</Button>
                </Link>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
