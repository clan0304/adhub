// components/JobPostingCard.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  has_deadline: boolean;
  deadline_date: string | null;
  deadline_time: string | null;
  created_at: string;
  status: 'active' | 'completed' | 'cancelled';
  user_id: string;
  username: string;
  profile_photo: string | null;
  city: string;
  country: string;
  first_name: string;
  last_name: string;
  user_type: string;
}

interface JobPostingCardProps {
  job: JobPosting;
  isOwner: boolean;
  onDelete: (id: string) => Promise<void>;
}

export default function JobPostingCard({
  job,
  isOwner,
  onDelete,
}: JobPostingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format created date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  // Format deadline date and time
  const formatDeadline = (
    dateString: string | null,
    timeString: string | null
  ) => {
    if (!dateString) return 'No deadline';

    const date = new Date(dateString);
    let formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

    if (timeString) {
      formattedDate += ` at ${timeString}`;
    }

    return formattedDate;
  };

  // Check if deadline has passed
  const isDeadlinePassed = () => {
    if (!job.has_deadline || !job.deadline_date) return false;

    const today = new Date();
    const deadline = new Date(job.deadline_date);

    if (job.deadline_time) {
      const [hours, minutes] = job.deadline_time.split(':').map(Number);
      deadline.setHours(hours, minutes);
    } else {
      deadline.setHours(23, 59, 59);
    }

    return today > deadline;
  };

  const handleDeleteJob = async () => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    setIsDeleting(true);

    try {
      await onDelete(job.id);
    } catch (err) {
      console.error('Error deleting job posting:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {job.profile_photo ? (
                <Image
                  src={job.profile_photo}
                  alt={job.username}
                  width={60}
                  height={60}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                  <span className="text-sm font-bold">
                    {job.first_name.charAt(0)}
                    {job.last_name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {job.first_name} {job.last_name}
              </p>
              <p className="text-xs text-gray-500">
                Posted on {formatDate(job.created_at)}
              </p>
            </div>
          </div>

          {/* Options menu for owner */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button
                    onClick={handleDeleteJob}
                    disabled={isDeleting}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Job Posting'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">{job.title}</h3>

        <div className="mb-4">
          <p className={`text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
            {job.description}
          </p>
          {job.description.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-indigo-600 mt-1 hover:underline"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600 mb-2">
          <svg
            className="inline-block h-4 w-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
          {job.city}, {job.country}
        </div>

        {job.has_deadline && (
          <div
            className={`text-sm ${
              isDeadlinePassed() ? 'text-red-600' : 'text-indigo-600'
            }`}
          >
            <svg
              className="inline-block h-4 w-4 mr-1"
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
            <span className="font-medium">Deadline:</span>{' '}
            {formatDeadline(job.deadline_date, job.deadline_time)}
            {isDeadlinePassed() && ' (Expired)'}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition-colors">
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
}
