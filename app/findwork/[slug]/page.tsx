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

export default function JobPostingDetailPage() {
  const { slug } = useParams();
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchJobPosting = async () => {
      try {
        setLoading(true);

        // Fetch job posting by slug with join to profiles
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
          .eq('slug', slug)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          // Transform the nested data
          const transformedData = {
            ...data,
            user_id: data.profiles.user_id,
            username: data.profiles.username,
            profile_photo: data.profiles.profile_photo,
            city: data.profiles.city,
            country: data.profiles.country,
            first_name: data.profiles.first_name,
            last_name: data.profiles.last_name,
            user_type: data.profiles.user_type,
          };

          setJobPosting(transformedData as JobPosting);
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
      fetchJobPosting();
    }
  }, [slug]);

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
          <Button variant="outline" className="mb-6">
            ← Back to Listings
          </Button>
        </Link>

        <h1 className="text-3xl font-bold">{jobPosting.title}</h1>
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
            <p className="font-medium">
              {jobPosting.first_name} {jobPosting.last_name}
            </p>
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
          ) : (
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isDeadlinePassed()}
            >
              Apply Now
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
